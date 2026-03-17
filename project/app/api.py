import uuid
import random
from ninja import NinjaAPI, Schema
from typing import List
from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from django.db.models import F
from .models import Card, User, PlayerCard
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

class PlayerCardSchema(Schema):
    id: int
    name: str
    image: str
    category: str
    rarity: str
    illustrator: str
    quantity: int


class BoosterCardOut(Schema):
    name: str
    card_id: str
    image: str
    category: str
    rarity: str
    illustrator: str

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

@api.get("/player/card", auth=jwt_auth, response={200: List[PlayerCardSchema], 400: ErrorOut})
def view_card(request):
    claims = request.auth_user
    user_id = claims["sub"]
    queryset = PlayerCard.objects.select_related('card').filter(card_user__user_id=user_id)
    data = [
        {
            "id": pc.id,
            "name": pc.card.name,
            "image": pc.card.image,
            "category": pc.card.category,
            "rarity": pc.card.rarity,
            "illustrator": pc.card.illustrator,
            "quantity": pc.quantity,
        }
        for pc in queryset
    ]
    return data


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
    try:
        existing = User.objects.get(email=email)
        if existing.password:
            return 409, {"detail": "An account with this email already exists."}
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


RARITY_TIERS = {
    "common": ["One Diamond", "Two Diamond"],
    "uncommon": ["Three Diamond", "Four Diamond"],
    "rare": ["One Shiny", "One Star", "Two Star", "Three Star", "Two Shiny", "Crown"],
}

RARE_WEIGHTS = {
    "One Shiny": 5,
    "One Star": 4,
    "Two Star": 2.5,
    "Three Star": 1.5,
    "Two Shiny": 0.8,
    "Crown": 0.3,
}


@api.post("/booster/open", auth=jwt_auth, response={200: list[BoosterCardOut], 404: ErrorOut, 500: ErrorOut})
def open_booster(request):
    claims = request.auth_user
    user_id = claims["sub"]

    with transaction.atomic():
        try:
            user = User.objects.select_for_update().get(user_id=user_id)
        except User.DoesNotExist:
            return 404, {"detail": "User not found"}

        common_cards = list(Card.objects.filter(rarity__in=RARITY_TIERS["common"]))
        uncommon_cards = list(Card.objects.filter(rarity__in=RARITY_TIERS["uncommon"]))
        rare_cards = list(Card.objects.filter(rarity__in=RARITY_TIERS["rare"]))

        pulled = []

        # 6 common (fallback: uncommon → rare)
        pool = common_cards or uncommon_cards or rare_cards
        if pool:
            pulled.extend(random.choices(pool, k=6))

        # 2 uncommon (fallback: common → rare)
        pool = uncommon_cards or common_cards or rare_cards
        if pool:
            pulled.extend(random.choices(pool, k=2))

        # 2 rare weighted (fallback: uncommon → common)
        if rare_cards:
            weights = [RARE_WEIGHTS.get(c.rarity, 1) for c in rare_cards]
            pulled.extend(random.choices(rare_cards, weights=weights, k=2))
        else:
            pool = uncommon_cards or common_cards
            if pool:
                pulled.extend(random.choices(pool, k=2))

        if not pulled:
            return 500, {"detail": "No cards available"}

        # Save to collection
        for card in pulled:
            pc, created = PlayerCard.objects.get_or_create(
                card_user=user, card=card, defaults={"quantity": 1}
            )
            if not created:
                pc.quantity = F("quantity") + 1
                pc.save(update_fields=["quantity"])

    return 200, [
        {
            "name": c.name,
            "card_id": c.card_id,
            "image": c.image,
            "category": c.category or "",
            "rarity": c.rarity or "",
            "illustrator": c.illustrator or "",
        }
        for c in pulled
    ]
