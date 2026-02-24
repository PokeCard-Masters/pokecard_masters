import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { AUTH_CONFIG, GOOGLE_DISCOVERY } from "@/config/auth";
import { apiFetch } from "@/services/api";

// SecureStore doesn't work on web — fall back to localStorage
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
    storage.getItem(TOKEN_KEY).then((saved) => {
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
          // Register/sync user in Django backend
          await apiFetch("/api/me", idToken);
        }
      });
    }
  }, [response]);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    setToken(null);
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(REFRESH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
