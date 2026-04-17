import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { AUTH_CONFIG, GOOGLE_DISCOVERY } from "@/config/auth";
import { apiFetch } from "@/services/api";
import { API_BASE_URL } from "@/config/auth";

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

WebBrowser.maybeCompleteAuthSession();

type User = {
  name: string | null;
  email: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signInWithPassword: async () => null,
  register: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "google_refresh_token";

function extractError(data: any): string {
  if (Array.isArray(data?.detail)) {
    return data.detail.map((e: any) => e.msg).join(", ");
  }
  if (typeof data?.detail === "string") return data.detail;
  return "Une erreur est survenue.";
}

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
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

  const extractUserFromToken = useCallback((idToken: string) => {
    const decoded = decodeJwt(idToken);
    if (decoded) {
      setUser({
        name: decoded.name ?? null,
        email: decoded.email ?? null,
      });
    }
  }, []);

  useEffect(() => {
    storage.getItem(TOKEN_KEY).then((saved) => {
      if (saved) {
        setToken(saved);
        extractUserFromToken(saved);
      }
      setIsLoading(false);
    });
  }, [extractUserFromToken]);

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
          extractUserFromToken(idToken);
          await storage.setItem(TOKEN_KEY, idToken);

          if (tokenResponse.refreshToken) {
            await storage.setItem(REFRESH_KEY, tokenResponse.refreshToken);
          }

          await apiFetch("/api/me", idToken);
        }
      });
    }
  }, [response, request, redirectUri, extractUserFromToken]);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return extractError(data); 
        }

        setToken(data.token);
        extractUserFromToken(data.token);
        await storage.setItem(TOKEN_KEY, data.token);

        return null;
      } catch {
        return "Network error. Please try again.";
      }
    },
    [extractUserFromToken]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, pseudo: name, name: name, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return extractError(data); 
        }

        setToken(data.token);
        extractUserFromToken(data.token);
        await storage.setItem(TOKEN_KEY, data.token);

        return null;
      } catch {
        return "Network error. Please try again.";
      }
    },
    [extractUserFromToken]
  );

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(REFRESH_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        signIn,
        signInWithPassword,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}