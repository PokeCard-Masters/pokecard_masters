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
