import jwt
import requests
from django.conf import settings
from django.http import HttpRequest
from ninja.security import HttpBearer
from typing import Optional
 
 
class ZitadelJWTAuth(HttpBearer):
    """
    JWT Authentication for Django Ninja using Zitadel tokens.
 
    Validates JWT tokens from Zitadel by:
    1. Extracting the token from Authorization header
    2. Fetching Zitadel's public keys (JWKS)
    3. Validating token signature and claims
    """
 
    def __init__(self):
        super().__init__()
        self.jwks_uri = settings.OIDC_OP_JWKS_ENDPOINT
        self.client_id = settings.ZITADEL_CLIENT_ID
        self.issuer = settings.ZITADEL_SERVER_URL
        self._jwks_cache = None
 
    def _get_jwks(self):
        """Fetch JWKS from Zitadel (with simple caching)"""
        if self._jwks_cache is None:
            response = requests.get(self.jwks_uri)
            response.raise_for_status()
            self._jwks_cache = response.json()
        return self._jwks_cache
 
    def _get_signing_key(self, token):
        """Get the signing key from JWKS based on token's kid"""
        jwks = self._get_jwks()
        unverified_header = jwt.get_unverified_header(token)
 
        for key in jwks.get('keys', []):
            if key.get('kid') == unverified_header.get('kid'):
                return jwt.algorithms.RSAAlgorithm.from_jwk(key)
 
        raise ValueError("Unable to find appropriate signing key")
 
    def authenticate(self, request: HttpRequest, token: str) -> Optional[dict]:
        """
        Validate JWT token and return decoded claims.
 
        Args:
            request: The HTTP request
            token: The JWT token from Authorization header
 
        Returns:
            Decoded token claims if valid, None if invalid
        """
        print(f"[AUTH DEBUG] Authenticating request, token length: {len(token) if token else 0}")
        try:
            # Get signing key
            signing_key = self._get_signing_key(token)
 
            # First, try to decode without audience validation to check what we have
            # This is needed because service account tokens have different audiences
            decoded = jwt.decode(
                token,
                key=signing_key,
                algorithms=["RS256"],
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,  # Don't verify audience initially
                    "verify_iss": True,
                }
            )
 
            # Manually verify audience - accept either web app client ID or project IDs
            token_aud = decoded.get("aud", [])
            if isinstance(token_aud, str):
                token_aud = [token_aud]
 
            # Accept if audience contains our client ID OR if it's a valid Zitadel token
            # (service accounts have project IDs as audience)
            valid_audience = (
                self.client_id in token_aud or  # Web app client
                len(token_aud) > 0  # Service account with project ID
            )
 
            if not valid_audience:
                return None
 
            # Attach decoded token to request for use in views
            request.auth_user = decoded
            return decoded
 
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            # For debugging - remove in production
            print(f"JWT validation error: {e}")
            return None