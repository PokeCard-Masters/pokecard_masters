from ninja import NinjaAPI, Schema
from typing import List
from .models import Card
from .authentification import ZitadelJWTAuth

jwt_auth = ZitadelJWTAuth()

api = NinjaAPI(auth=None)

class CardsOut(Schema):
    id: int
    name: str

@api.get("/hello")
def hello(request):
    return "Hello world"

@api.get("/card", response=List[CardsOut], auth=jwt_auth)
def list_card(request):
    qs = Card.objects.all()
    return qs

