# Google OAuth2 Sign-In Design

**Date:** 2026-02-24
**Status:** Approved
**Replaces:** Zitadel OIDC authentication

## Summary

Replace Zitadel with Google Sign-In across both the Expo mobile app and Django backend. Uses `expo-auth-session` with Google's OIDC discovery and PKCE flow. Django validates Google-issued ID tokens against Google's public JWKS.

## Architecture

### Auth Flow

1. User taps "Sign in with Google" in Expo
2. `expo-auth-session` opens system browser to Google's OAuth consent page
3. User authenticates → Google redirects to `apppokemasters://` with auth code
4. Expo exchanges code for tokens (ID token + access token) via PKCE
5. Expo stores tokens securely with `expo-secure-store`
6. API calls include `Authorization: Bearer <google_id_token>`
7. Django `GoogleJWTAuth` validates token against Google's JWKS
8. On first login, Django auto-creates a `User` record from Google claims

### Token Lifecycle

- Google ID tokens expire after ~1 hour
- Expo checks `TokenResponse.isTokenFresh()` before API calls
- Stale tokens refreshed via `refreshAsync()` with the refresh token
- Refresh tokens stored in `expo-secure-store`

## Expo App Changes

### New Packages

- `expo-auth-session` + `expo-crypto` — OAuth2/OIDC flow
- `expo-secure-store` — Secure token storage

### New Files

- `config/auth.ts` — Google client ID, OIDC discovery, redirect URI
- `context/AuthContext.tsx` — Auth state: `{ user, token, signIn, signOut, isLoading }`
- `app/(auth)/login.tsx` — Login screen with Google button
- `services/api.ts` — API client with Bearer token

### Modified Files

- `app/_layout.tsx` — Wrap in `AuthProvider`, redirect unauthenticated users
- `app/(tabs)/_layout.tsx` — Protected behind auth

## Django Backend Changes

### Modified Files

- `app/authentification.py` — Replace `ZitadelJWTAuth` with `GoogleJWTAuth`
  - Fetches JWKS from `https://www.googleapis.com/oauth2/v3/certs`
  - Validates RS256 signature, issuer (`accounts.google.com`), audience, expiry
  - Auto-creates `User` on first login from `sub`, `email`, `name` claims
- `project/settings.py` — Remove OIDC settings, add `GOOGLE_CLIENT_ID`
- `project/.env` — Remove Zitadel vars, add `GOOGLE_CLIENT_ID`
- `project/urls.py` — Remove `oidc/` URL include
- `pyproject.toml` — Remove `mozilla-django-oidc`, add `google-auth`

### Removed

- `zitadel/` directory (docker-compose, configs)
- All Zitadel references

## Manual Setup Required

Google Cloud Console:
1. Create/select project
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials
4. Set redirect URI: `apppokemasters://`
5. Note Client ID for Expo config and Django `.env`

## Decisions

- **Approach:** `expo-auth-session` + Google OIDC (over native SDK or Django intermediary)
- **Token strategy:** Google ID token sent directly to Django (no custom JWT layer)
- **Storage:** `expo-secure-store` for tokens on device
- **User creation:** Auto-create on first API call from Google claims
