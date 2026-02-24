from ninja import NinjaAPI, Schema
from typing import List
from .models import Card, User
from .authentification import GoogleJWTAuth

jwt_auth = GoogleJWTAuth()

api = NinjaAPI(auth=None)

class CardsOut(Schema):
    id: int
    name: str

class UserOut(Schema):
    id: int
    name: str
    email: str

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
