export const AUTH_CONFIG = {
  clientId: "824321648124-j8626qfulj3gjc8dbp49btiks392vn78.apps.googleusercontent.com",
  clientSecret: "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",
  scopes: ["openid", "profile", "email"],
};

// Google OIDC discovery document
export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const API_BASE_URL = "http://localhost:8000";
