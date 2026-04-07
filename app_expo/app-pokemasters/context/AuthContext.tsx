import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { AUTH_CONFIG, GOOGLE_DISCOVERY } from "@/config/auth";
import { apiFetch } from "@/services/api";
import { API_BASE_URL } from "@/config/auth";
import * as AppleAuthentication from "expo-apple-authentication";

const ID_KEY = "appleAuthUserId"
const NAME_KEY = "appleAuthName"
const EMAIL_KEY = "appleAuthEmail"

interface User {
  id: string | null;
  name: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (
    credential: AppleAuthentication.AppleAuthenticationCredential,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContextApple = createContext<AuthContextType | undefined>(undefined);

export default function AuthProviderApple({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({ id: null, name: null, email: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storeId = await SecureStore.getItemAsync(ID_KEY);
        if (storeId) {
          const state = await AppleAuthentication.getCredentialStateAsync(storeId);
          if (state === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED) {
            const name = await SecureStore.getItemAsync(NAME_KEY);
            const email = await SecureStore.getItemAsync(EMAIL_KEY);
            setUser({ id: storeId, name, email });
          } else {
            await SecureStore.deleteItemAsync(ID_KEY);
            await SecureStore.deleteItemAsync(NAME_KEY);
            await SecureStore.deleteItemAsync(EMAIL_KEY);
          }
        }
      } catch (error) {
        console.error("Error loading auth", error);
      } finally {
        setLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const login = async (credential: AppleAuthentication.AppleAuthenticationCredential,) => {
    const id = credential.user
    await SecureStore.setItemAsync(ID_KEY, id)

    if (credential.fullName) {
      const formattedName = [
        credential.fullName.givenName,
        credential.fullName.familyName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (formattedName) {
        await SecureStore.setItemAsync(NAME_KEY, formattedName)
      }
    }
    if (credential.email) {
      await SecureStore.setItemAsync(EMAIL_KEY, credential.email)
    }

    const name = await SecureStore.getItemAsync(NAME_KEY);
    const email = await SecureStore.getItemAsync(EMAIL_KEY);

    setUser({ id, name, email })
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync(ID_KEY);
    await SecureStore.deleteItemAsync(NAME_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    setUser({ id: null, name: null, email: null });
  };

  return (
    <AuthContextApple.Provider value={{ user, loading, login, logout }}>
    {children}
    </AuthContextApple.Provider>
  );
}

export function useAuth_apple() {
  const context = useContext(AuthContextApple);
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context;
}

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  token: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  token: null,
  isLoading: true,
  signIn: async () => { },
  signInWithPassword: async () => null,
  register: async () => null,
  signOut: async () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = "auth_token";
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

  useEffect(() => {
    storage.getItem(TOKEN_KEY).then((saved) => {
      if (saved) setToken(saved);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (response?.type === "success" && request) {
      const { code } = response.params;
      AuthSession.exchangeCodeAsync(
        {
          clientId: AUTH_CONFIG.clientId,
          clientSecret: AUTH_CONFIG.clientSecret,
          code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier! },
        },
        GOOGLE_DISCOVERY
      ).then(async (tokenResponse) => {
        const idToken = tokenResponse.idToken;
        if (idToken) {
          setToken(idToken);
          storage.setItem(TOKEN_KEY, idToken);
          if (tokenResponse.refreshToken) {
            storage.setItem(REFRESH_KEY, tokenResponse.refreshToken);
          }
          await apiFetch("/api/me", idToken);
        }
      });
    }
  }, [response]);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return data.detail || "Login failed.";
      }
      setToken(data.token);
      await storage.setItem(TOKEN_KEY, data.token);
      return null;
    } catch {
      return "Network error. Please try again.";
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return data.detail || "Registration failed.";
      }
      setToken(data.token);
      await storage.setItem(TOKEN_KEY, data.token);
      return null;
    } catch {
      return "Network error. Please try again.";
    }
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(REFRESH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signInWithPassword, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
