# Google OAuth2 Sign-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Zitadel with Google Sign-In on both the Expo mobile app and Django backend.

**Architecture:** Expo uses `expo-auth-session` with Google's OIDC discovery to obtain a Google ID token via PKCE. The token is stored with `expo-secure-store` and sent as `Authorization: Bearer <token>` to Django. Django validates the Google ID token against Google's public JWKS. On first login, Django auto-creates a User from Google claims.

**Tech Stack:** expo-auth-session, expo-crypto, expo-secure-store, google-auth (Python), Django Ninja

---

## Task 1: Remove Zitadel from Django backend

**Files:**
- Modify: `project/project/settings.py` (lines 20-24, 52, 65, 68-71, 150-183)
- Modify: `project/project/urls.py` (line 24)
- Modify: `project/.env` (lines 1-6)
- Modify: `pyproject.toml` (line 13 — `mozilla-django-oidc`)
- Delete: `zitadel/` directory

**Step 1: Clean up `project/.env`**

Replace entire contents with:

```env
DJANGO_SECRET_KEY=django-insecure-4&8rw$wrhzj1b^cf+35^kvmvt#98#g%&d1z@+q+w+%nr^56f3+
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

**Step 2: Clean up `project/project/settings.py`**

Remove lines 20-24 (Zitadel vars):
```python
ZITADEL_SERVER_URL = os.environ["ZITADEL_SERVER_URL"]
ZITADEL_CLIENT_ID = os.environ["ZITADEL_CLIENT_ID"]
ZITADEL_CLIENT_SECRET = os.environ["ZITADEL_CLIENT_SECRET"]

OIDC_OP_LOGOUT_ENDPOINT = f"{ZITADEL_SERVER_URL}/oidc/v1/end_session"
OIDC_RP_POST_LOGOUT_REDIRECT_URI = "http://localhost:8000/"
```

Replace with:
```python
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
```

Remove `"mozilla_django_oidc"` from `INSTALLED_APPS` (line 52).

Remove `"mozilla_django_oidc.middleware.SessionRefresh"` from `MIDDLEWARE` (line 65).

Remove `"mozilla_django_oidc.auth.OIDCAuthenticationBackend"` from `AUTHENTICATION_BACKENDS` (line 70).

Remove all OIDC settings (lines 150-183):
```python
# Mozilla Django OIDC Configuration for Zitadel
OIDC_RP_CLIENT_ID = ...
...
OIDC_UPDATE_USER = True
```

**Step 3: Remove OIDC URL route from `project/project/urls.py`**

Remove line 24:
```python
path("oidc/", include("mozilla_django_oidc.urls")),
```

**Step 4: Remove `mozilla-django-oidc` from `pyproject.toml`**

Remove `"mozilla-django-oidc>=4.0.1"` from dependencies. Add `"google-auth>=2.0.0"`.

**Step 5: Delete `zitadel/` directory**

```bash
rm -rf zitadel/
```

**Step 6: Run `uv sync` to update dependencies**

```bash
uv sync
```

**Step 7: Verify Django starts**

```bash
uv run python project/manage.py check
```

Expected: `System check identified no issues.`

**Step 8: Commit**

```bash
git add -A && git commit -m "chore: remove Zitadel and mozilla-django-oidc"
```

---

## Task 2: Implement GoogleJWTAuth in Django

**Files:**
- Rewrite: `project/app/authentification.py`
- Modify: `project/app/api.py` (line 4 — import rename)

**Step 1: Rewrite `project/app/authentification.py`**

```python
import requests
from django.conf import settings
from django.http import HttpRequest
from ninja.security import HttpBearer
from typing import Optional
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token


class GoogleJWTAuth(HttpBearer):
    """
    JWT Authentication for Django Ninja using Google ID tokens.

    Validates Google-issued ID tokens by verifying the signature
    against Google's public JWKS and checking issuer/audience claims.
    """

    def __init__(self):
        super().__init__()
        self.client_id = settings.GOOGLE_CLIENT_ID

    def authenticate(self, request: HttpRequest, token: str) -> Optional[dict]:
        try:
            claims = id_token.verify_oauth2_token(
                token,
                GoogleRequest(),
                self.client_id,
            )

            # Verify issuer
            if claims["iss"] not in ("accounts.google.com", "https://accounts.google.com"):
                return None

            request.auth_user = claims
            return claims

        except ValueError:
            return None
```

**Step 2: Update import in `project/app/api.py`**

Change line 4 from:
```python
from .authentification import ZitadelJWTAuth
```
to:
```python
from .authentification import GoogleJWTAuth
```

Change line 6 from:
```python
jwt_auth = ZitadelJWTAuth()
```
to:
```python
jwt_auth = GoogleJWTAuth()
```

**Step 3: Verify Django starts**

```bash
uv run python project/manage.py check
```

Expected: `System check identified no issues.`

**Step 4: Commit**

```bash
git add project/app/authentification.py project/app/api.py
git commit -m "feat: replace ZitadelJWTAuth with GoogleJWTAuth"
```

---

## Task 3: Add a `/api/me` endpoint for the Expo app

The Expo app needs a way to get the current user's info after login. This endpoint also handles auto-creating the User on first login.

**Files:**
- Modify: `project/app/api.py`
- Modify: `project/app/models.py` (make `password` optional since Google users don't have one)

**Step 1: Update User model — make `password` nullable**

In `project/app/models.py`, change line 16:
```python
password = models.CharField(max_length=50)
```
to:
```python
password = models.CharField(max_length=50, blank=True, default="")
```

**Step 2: Generate and apply migration**

```bash
uv run python project/manage.py makemigrations app
uv run python project/manage.py migrate
```

**Step 3: Add `/api/me` endpoint to `project/app/api.py`**

Add after existing endpoints:

```python
from .models import Card, User

class UserOut(Schema):
    id: int
    name: str
    email: str

@api.get("/me", response=UserOut, auth=jwt_auth)
def get_me(request):
    """Get or create user from Google token claims."""
    claims = request.auth_user
    google_sub = claims["sub"]
    email = claims.get("email", "")
    name = claims.get("name", "")

    user, created = User.objects.get_or_create(
        user_id=google_sub,
        defaults={"name": name, "email": email},
    )

    if not created and (user.name != name or user.email != email):
        user.name = name
        user.email = email
        user.save()

    return user
```

**Step 4: Verify Django starts**

```bash
uv run python project/manage.py check
```

**Step 5: Commit**

```bash
git add project/app/api.py project/app/models.py project/app/migrations/
git commit -m "feat: add /api/me endpoint with Google user auto-creation"
```

---

## Task 4: Install Expo auth packages

**Files:**
- Modify: `app_expo/app-pokemasters/package.json`

**Step 1: Install packages**

```bash
cd app_expo/app-pokemasters && npx expo install expo-auth-session expo-crypto expo-secure-store
```

**Step 2: Verify install**

```bash
cat app_expo/app-pokemasters/package.json | grep -E "auth-session|crypto|secure-store"
```

Expected: all three packages listed.

**Step 3: Commit**

```bash
git add app_expo/app-pokemasters/package.json app_expo/app-pokemasters/package-lock.json
git commit -m "chore: install expo-auth-session, expo-crypto, expo-secure-store"
```

---

## Task 5: Create auth config and API service

**Files:**
- Create: `app_expo/app-pokemasters/config/auth.ts`
- Create: `app_expo/app-pokemasters/services/api.ts`

**Step 1: Create `config/auth.ts`**

```typescript
export const AUTH_CONFIG = {
  clientId: "YOUR_GOOGLE_CLIENT_ID_HERE",
  scopes: ["openid", "profile", "email"],
};

// Google OIDC discovery document
export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const API_BASE_URL = "http://localhost:8000";
```

**Step 2: Create `services/api.ts`**

```typescript
import { API_BASE_URL } from "@/config/auth";

export async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
```

**Step 3: Commit**

```bash
git add app_expo/app-pokemasters/config/ app_expo/app-pokemasters/services/
git commit -m "feat: add auth config and API service for Expo"
```

---

## Task 6: Create AuthContext provider

**Files:**
- Create: `app_expo/app-pokemasters/context/AuthContext.tsx`

**Step 1: Create `context/AuthContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { AUTH_CONFIG, GOOGLE_DISCOVERY } from "@/config/auth";

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  token: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = "google_id_token";
const REFRESH_KEY = "google_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "apppokemasters" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH_CONFIG.clientId,
      scopes: AUTH_CONFIG.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  // Restore token on app start
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then((saved) => {
      if (saved) setToken(saved);
      setIsLoading(false);
    });
  }, []);

  // Handle auth response
  useEffect(() => {
    if (response?.type === "success" && request) {
      const { code } = response.params;
      AuthSession.exchangeCodeAsync(
        {
          clientId: AUTH_CONFIG.clientId,
          code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier! },
        },
        GOOGLE_DISCOVERY
      ).then((tokenResponse) => {
        const idToken = tokenResponse.idToken;
        if (idToken) {
          setToken(idToken);
          SecureStore.setItemAsync(TOKEN_KEY, idToken);
          if (tokenResponse.refreshToken) {
            SecureStore.setItemAsync(REFRESH_KEY, tokenResponse.refreshToken);
          }
        }
      });
    }
  }, [response]);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Step 2: Commit**

```bash
git add app_expo/app-pokemasters/context/
git commit -m "feat: add AuthContext with Google OIDC sign-in flow"
```

---

## Task 7: Create login screen and wire up auth in layout

**Files:**
- Create: `app_expo/app-pokemasters/app/(auth)/login.tsx`
- Create: `app_expo/app-pokemasters/app/(auth)/_layout.tsx`
- Modify: `app_expo/app-pokemasters/app/_layout.tsx`

**Step 1: Create `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 2: Create `app/(auth)/login.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokeMasters</Text>
      <Text style={styles.subtitle}>Sign in to manage your collection</Text>
      <Pressable style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  button: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
```

**Step 3: Update `app/_layout.tsx`**

Replace entire file with:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootNavigator() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
```

**Step 4: Verify Expo starts**

```bash
cd app_expo/app-pokemasters && npx expo start --clear
```

Check that the login screen shows up when opening the app.

**Step 5: Commit**

```bash
git add app_expo/app-pokemasters/app/
git commit -m "feat: add login screen and auth-gated navigation"
```

---

## Task 8: Google Cloud Console setup (manual)

This task requires manual action in the browser — cannot be automated.

**Step 1:** Go to https://console.cloud.google.com/

**Step 2:** Create or select a project (e.g., "PokeMasters").

**Step 3:** Go to "APIs & Services" > "OAuth consent screen". Configure:
- App name: PokeMasters
- User support email: your email
- Scopes: `openid`, `profile`, `email`
- Test users: add your Google email

**Step 4:** Go to "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs".
- Application type: **Web application** (works for expo-auth-session's PKCE flow)
- Authorized redirect URIs: add `apppokemasters://` and `https://auth.expo.io/@your-expo-username/app-pokemasters`
- Note the **Client ID**

**Step 5:** Update the Client ID in two places:
- `app_expo/app-pokemasters/config/auth.ts` — replace `YOUR_GOOGLE_CLIENT_ID_HERE`
- `project/.env` — replace `YOUR_GOOGLE_CLIENT_ID_HERE`

**Step 6: Commit**

```bash
git add app_expo/app-pokemasters/config/auth.ts project/.env
git commit -m "chore: configure Google OAuth client ID"
```

---

## Task 9: End-to-end verification

**Step 1:** Start Django backend:
```bash
uv run python project/manage.py runserver
```

**Step 2:** Start Expo:
```bash
cd app_expo/app-pokemasters && npx expo start
```

**Step 3:** Open app on device/simulator. Verify:
- Login screen appears
- "Sign in with Google" opens browser
- After Google auth, redirects back to app
- App navigates to the tabs screen
- Calling `/api/me` returns user info
- Calling `/api/card` returns cards (with valid token)

**Step 4:** Test sign out — verify user returns to login screen.

**Step 5: Commit any fixes, then final commit:**

```bash
git add -A && git commit -m "feat: Google OAuth2 sign-in working end-to-end"
```
