import datetime
import jwt
from django.conf import settings
from django.http import HttpRequest
from ninja.security import HttpBearer
from typing import Optional
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token


def create_app_jwt(user) -> str:
    """Create a self-signed JWT for a local user."""
    payload = {
        "sub": user.user_id,
        "email": user.email,
        "name": user.name,
        "iss": "pokemasters",
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


class GoogleJWTAuth(HttpBearer):
    """
    Combined JWT Authentication for Django Ninja.
    Tries Google ID token first, then falls back to app-issued JWT.
    """

    def __init__(self):
        super().__init__()
        self.client_id = settings.GOOGLE_CLIENT_ID

    def authenticate(self, request: HttpRequest, token: str) -> Optional[dict]:
        # Try Google token first
        claims = self._try_google(request, token)
        if claims:
            return claims

        # Fall back to app-issued JWT
        return self._try_app_jwt(request, token)

    def _try_google(self, request: HttpRequest, token: str) -> Optional[dict]:
        try:
            claims = id_token.verify_oauth2_token(
                token,
                GoogleRequest(),
                self.client_id,
            )
            if claims["iss"] not in (
                "accounts.google.com",
                "https://accounts.google.com",
            ):
                return None
            request.auth_user = claims
            return claims
        except (ValueError, KeyError):
            return None

    def _try_app_jwt(self, request: HttpRequest, token: str) -> Optional[dict]:
        try:
            claims = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
                issuer="pokemasters",
            )
            request.auth_user = claims
            return claims
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
            return None
