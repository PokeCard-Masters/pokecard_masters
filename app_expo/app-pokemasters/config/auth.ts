export const AUTH_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET ?? "",
  scopes: ["openid", "profile", "email"],
};

// Google OIDC discovery document
export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
