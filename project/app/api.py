import uuid
from ninja import NinjaAPI, Schema
from typing import List
from django.contrib.auth.hashers import make_password, check_password
from .models import Card, User
from .authentification import GoogleJWTAuth, create_app_jwt

jwt_auth = GoogleJWTAuth()

api = NinjaAPI(auth=None)


class CardsOut(Schema):
    id: int
    name: str


class UserOut(Schema):
    id: int
    name: str
    email: str


class RegisterIn(Schema):
    email: str
    password: str
    name: str


class LoginIn(Schema):
    email: str
    password: str


class TokenOut(Schema):
    token: str
    user: UserOut


class ErrorOut(Schema):
    detail: str


@api.get("/hello")
def hello(request):
    return "Hello world"


@api.get("/card", response=List[CardsOut], auth=jwt_auth)
def list_card(request):
    qs = Card.objects.all()
    return qs


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


@api.post("/auth/register", response={201: TokenOut, 409: ErrorOut, 400: ErrorOut})
def register(request, payload: RegisterIn):
    """Register a new user with email and password."""
    email = payload.email.strip().lower()
    name = payload.name.strip()
    password = payload.password

    if not email or not name or not password:
        return 400, {"detail": "All fields are required."}

    if len(password) < 6:
        return 400, {"detail": "Password must be at least 6 characters."}

    # Check if user with this email already has a password set
    try:
        existing = User.objects.get(email=email)
        if existing.password:
            return 409, {"detail": "An account with this email already exists."}
        # Google-only user: link account by setting password
        existing.password = make_password(password)
        existing.name = name
        existing.save()
        token = create_app_jwt(existing)
        return 201, {"token": token, "user": existing}
    except User.DoesNotExist:
        pass

    user = User.objects.create(
        user_id=f"local_{uuid.uuid4().hex[:16]}",
        name=name,
        email=email,
        password=make_password(password),
    )
    token = create_app_jwt(user)
    return 201, {"token": token, "user": user}


@api.post("/auth/login", response={200: TokenOut, 401: ErrorOut})
def login(request, payload: LoginIn):
    """Login with email and password."""
    email = payload.email.strip().lower()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return 401, {"detail": "Invalid email or password."}

    if not user.password or not check_password(payload.password, user.password):
        return 401, {"detail": "Invalid email or password."}

    token = create_app_jwt(user)
    return 200, {"token": token, "user": user}
