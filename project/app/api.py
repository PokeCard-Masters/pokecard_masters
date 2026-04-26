from django.contrib.auth.hashers import make_password, check_password
from .authentification import GoogleJWTAuth, create_app_jwt
from .models import Card, User, PlayerCard
from ninja import NinjaAPI, Schema
from django.db import transaction
from django.db.models import F, OuterRef, Subquery, IntegerField, Value
from django.db.models.functions import Coalesce
from typing import Optional
from typing import List
from django.core.paginator import Paginator

import random
import uuid

jwt_auth = GoogleJWTAuth()

api = NinjaAPI(auth=None)


class CardsOut(Schema):
    id: int
    name: str
    image: str
    types: str | None


class UserOut(Schema):
    id: int
    name: str
    email: str


class RegisterIn(Schema):
    email: str
    password: str
    name: str
    pseudo: str


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
    category: str | None
    rarity: str | None
    illustrator: str | None
    quantity: int


class BoosterCardOut(Schema):
    name: str
    card_id: str
    image: str
    category: str
    rarity: str
    illustrator: str


class BoosterCountOut(Schema):
    cards: list[BoosterCardOut]
    booster_count: int

class ChangePasswordIn(Schema):
    current_password: str
    new_password: str

class TrophyOut(Schema):
    key: str
    label: str
    emoji: str
    count: int
    tier: Optional[str]      # None | 'bronze' | 'silver' | 'gold' | 'platinum'
    next_tier: Optional[str]
    next_threshold: Optional[int]
    progress: float          # 0.0 → 1.0 vers le prochain palier
 
 
class ProfilOut(Schema):
    name: str
    email: str
    boosters_opened: int
    cards_owned: int
    unique_cards: int
    type_trophies: List[TrophyOut]
    category_trophies: List[TrophyOut]


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


@api.get(
    "/player/card", auth=jwt_auth, response={200: List[PlayerCardSchema], 400: ErrorOut}
)
def view_card(request):
    claims = request.auth_user
    user_id = claims["sub"]
    queryset = PlayerCard.objects.select_related("card").filter(
        card_user__user_id=user_id
    )
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
    pseudo = payload.pseudo.strip()
    name = payload.name.strip()
    password = payload.password

    if not email or not name or not password or not pseudo:
        return 400, {"detail": "All fields are required."}

    if len(password) < 6:
        return 400, {"detail": "Password must be at least 6 characters."}
    try:
        existing = User.objects.get(email=email)
        if existing.password:
            return 409, {"detail": "An account with this email already exists."}
        if User.objects.filter(pseudo_iexact=pseudo).exists():
            return 409, {"detail": "This pseudo is already taken."}
        existing.password = make_password(password)
        existing.name = name
        existing.pseudo = pseudo
        existing.save()
        token = create_app_jwt(existing)
        return 201, {"token": token, "user": existing}
    except User.DoesNotExist:
        pass

    user = User.objects.create(
        user_id=f"local_{uuid.uuid4().hex[:16]}",
        name=name,
        pseudo=pseudo,
        email=email,
        password=make_password(password),
    )
    token = create_app_jwt(user)
    return 201, {"token": token, "user": user}


@api.post("/auth/login", response={200: TokenOut, 401: ErrorOut, 400: ErrorOut})
def login(request, payload: LoginIn):
    """Login with email and password."""
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        return 400, {"detail": "Email and password are required."}

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return 401, {"detail": "Invalid email or password."}

    if not user.password or not check_password(password, user.password):
        return 401, {"detail": "Invalid email or password."}

    token = create_app_jwt(user)
    return 200, {"token": token, "user": user}


@api.post("/auth/change-password", auth=jwt_auth, response={200: ErrorOut, 400: ErrorOut, 401: ErrorOut})
def change_password(request, payload: ChangePasswordIn):
    claims = request.auth_user
    user_id = claims["sub"]
 
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return 401, {"detail": "Utilisateur introuvable."}
 
    if not check_password(payload.current_password, user.password):
        return 401, {"detail": "Mot de passe actuel incorrect."}
 
    if len(payload.new_password) < 8:
        return 400, {"detail": "Le nouveau mot de passe doit faire au moins 8 caractères."}
 
    if payload.current_password == payload.new_password:
        return 400, {"detail": "Le nouveau mot de passe doit être différent de l'actuel."}
 
    user.password = make_password(payload.new_password)
    user.save()
 
    return 200, {"detail": "Mot de passe modifié avec succès."}


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


@api.post("/booster/open", auth=jwt_auth, response={200: BoosterCountOut, 404: ErrorOut, 500: ErrorOut})
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

    User.objects.filter(pk=user.pk).update(booster_count=F("booster_count") + 1)
    user.refresh_from_db(fields=["booster_count"])

    return 200, {
        "cards": [
            {
                "name": c.name,
                "card_id": c.card_id,
                "image": c.image,
                "category": c.category or "",
                "rarity": c.rarity or "",
                "illustrator": c.illustrator or "",
            }
            for c in pulled
        ],
        "booster_count": user.booster_count,
    }

@api.get("/booster/count", auth=jwt_auth, response={200: dict})
def booster_count(request):
    claims = request.auth_user
    user = User.objects.get(user_id=claims["sub"])
    return {"booster_count": user.booster_count}

@api.get("/user/pagination", auth=jwt_auth)
def pagination(request, page: int = 1, limit: int = 10, rarity: Optional[str] = None):
    claims = request.auth_user
    user_id = claims["sub"]

    quantity_subquery = PlayerCard.objects.filter(
        card_user__user_id=user_id,
        card=OuterRef('pk')
    ).values('quantity')[:1]

    queryset = Card.objects.annotate(
        quantity=Coalesce(
            Subquery(quantity_subquery, output_field=IntegerField()),
            Value(0)
        )
    )
    if rarity:
        queryset = queryset.filter(rarity__icontains=rarity)

    paginator = Paginator(queryset, limit)
    page_obj = paginator.get_page(page)

    return {
        "items": [
            {
                "id": card.id, "name": card.name, "image": card.image,
                "category": card.category, "rarity": card.rarity,
                "illustrator": card.illustrator, "quantity": card.quantity,
            }
            for card in page_obj
        ],
        "count": paginator.count,
    }


@api.get("/user/collection/pagination", auth=jwt_auth)
def collection_pagination(request, page: int = 1, limit: int = 10, rarity: Optional[str] = None):
    claims = request.auth_user
    user_id = claims["sub"]

    queryset = PlayerCard.objects.select_related("card").filter(
        card_user__user_id=user_id
    )
    if rarity:
        queryset = queryset.filter(card__rarity__icontains=rarity)

    paginator = Paginator(queryset, limit)
    page_obj = paginator.get_page(page)

    return {
        "items": [
            {
                "id": pc.card.id, "name": pc.card.name, "image": pc.card.image,
                "category": pc.card.category, "rarity": pc.card.rarity,
                "illustrator": pc.card.illustrator, "quantity": pc.quantity,
            }
            for pc in page_obj
        ],
        "count": paginator.count,
    }


@api.get("/cards", response=List[CardsOut])
def get_cards(request, types: Optional[str] = None):
    cards = Card.objects.all()
    if types:
        cards = cards.filter(types__icontains=types)
    return cards

TYPE_THRESHOLDS = [
    ('bronze',   25),
    ('silver',   50),
    ('gold',    100),
    ('platinum', 200),
]
 
CATEGORY_THRESHOLDS = [
    ('bronze',    50),
    ('silver',   100),
    ('gold',     200),
    ('platinum', 400),
]
 
TIER_LABELS = {
    'bronze':   'Bronze',
    'silver':   'Argent',
    'gold':     'Or',
    'platinum': 'Platine',
}
 
TYPE_EMOJIS = {
    'Fire':     '🔥',
    'Water':    '💧',
    'Grass':    '🌿',
    'Lightning': '⚡',
    'Psychic':  '🔮',
    'Fighting': '🥊',
    'Darkness':     '🌑',
    'Metal':    '⚙️',
    'Dragon':   '🐉',
    'Fairy':    '🌸',
    'Colorless':   '⭐',
}
 
CATEGORY_EMOJIS = {
    'Pokemon':         '🐦‍🔥',
    'Trainer':         '🧢',
    'Energy':          '✨',
}
 
 
def compute_trophy(key: str, label: str, emoji: str, count: int, thresholds: list) -> dict:
    """Calcule le palier actuel, le suivant et la progression."""
    current_tier = None
    next_tier = None
    next_threshold = None
    progress = 0.0
 
    for tier_name, threshold in thresholds:
        if count >= threshold:
            current_tier = tier_name
 
    # Prochain palier
    for tier_name, threshold in thresholds:
        if count < threshold:
            next_tier = tier_name
            next_threshold = threshold
            break
 
    # Calcul de la progression vers le prochain palier
    if next_threshold is not None:
        # Trouver le seuil du palier actuel (ou 0)
        prev_threshold = 0
        for tier_name, threshold in thresholds:
            if tier_name == current_tier:
                prev_threshold = threshold
                break
        span = next_threshold - prev_threshold
        progress = min((count - prev_threshold) / span, 1.0) if span > 0 else 1.0
    else:
        progress = 1.0  # Platine atteint
 
    return {
        'key': key,
        'label': label,
        'emoji': emoji,
        'count': count,
        'tier': current_tier,
        'next_tier': next_tier,
        'next_threshold': next_threshold,
        'progress': round(progress, 3),
    }
 
 
@api.get("/profil", auth=jwt_auth, response={200: ProfilOut, 404: ErrorOut})
def get_profile(request):
    claims = request.auth_user
    user_id = claims["sub"]
 
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return 404, {"detail": "Utilisateur introuvable."}
 
    # Cartes possédées
    player_cards = PlayerCard.objects.select_related('card').filter(card_user=user)
 
    cards_owned  = sum(pc.quantity for pc in player_cards)
    unique_cards = player_cards.count()
 
 
    # ── Trophées par type ──
    type_counts: dict[str, int] = {}
    for pc in player_cards:
        card_type = pc.card.types  # champ 'type' de ton model Card
        if card_type:
            type_counts[card_type] = type_counts.get(card_type, 0) + pc.quantity
 
    type_trophies = [
        compute_trophy(
            key=t,
            label=t,
            emoji=TYPE_EMOJIS.get(t, '❓'),
            count=count,
            thresholds=TYPE_THRESHOLDS,
        )
        for t, count in sorted(type_counts.items(), key=lambda x: -x[1])
    ]
 
    # ── Trophées par catégorie ──
    category_counts: dict[str, int] = {}
    for pc in player_cards:
        cat = pc.card.category
        if cat:
            category_counts[cat] = category_counts.get(cat, 0) + pc.quantity
 
    category_trophies = [
        compute_trophy(
            key=c,
            label=c,
            emoji=CATEGORY_EMOJIS.get(c, '📦'),
            count=count,
            thresholds=CATEGORY_THRESHOLDS,
        )
        for c, count in sorted(category_counts.items(), key=lambda x: -x[1])
    ]
 
    return 200, {
        'name':              user.name,
        'email':             user.email,
        'boosters_opened':   user.booster_count,
        'cards_owned':       cards_owned,
        'unique_cards':      unique_cards,
        'type_trophies':     type_trophies,
        'category_trophies': category_trophies,
    }