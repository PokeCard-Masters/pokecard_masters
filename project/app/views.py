from django.shortcuts import render
from django.http import JsonResponse
import requests
from .models import Card, PlayerCard
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def view_card(request):
    if request.user.is_authenticated:
        queryset = PlayerCard.objects.filter(card_user=request.user)
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
    return Response(data)

def import_list(request):
    result = Card.objects.all()
    pokemon_list = []
    for pok in result:
        pokemon_list.append(
            {
                "id: ": pok.id,
                "Name: ": pok.name,
                "Image: ": pok.image,
                "Category: ": pok.category,
                "Rarity: ": pok.rarity,
                "Illustrator: ": pok.illustrator,
            }
        )
        return JsonResponse({"success": pokemon_list})
    else:
        return JsonResponse({"error": "Non authentifié"}, status=401)


def import_api(request):
    r = requests.get("https://api.tcgdex.net/v2/en/cards")
    r_json = r.json()
    number = 0
    for i in r_json:
        if "image" in i:
            card_id = i["id"]
            name = i["name"]
            image = i["image"]
            r_card = requests.get(f"https://api.tcgdex.net/v2/en/cards/{card_id}")
            r_card_json = r_card.json()
            category = r_card_json["category"]
            illustrator = None
            if "illustrator" in r_card_json:
                illustrator = r_card_json["illustrator"]
            rarity = r_card_json["rarity"]
            if number < 20000:
                new_pokemon = Card(
                    card_id=card_id,
                    name=name,
                    image=image,
                    category=category,
                    illustrator=illustrator,
                    rarity=rarity,
                )
                new_pokemon.save()
                number = number + 1
            else:
                break
        else:
            print(f"{i['name']} does not have image")
    return JsonResponse({"success": "ok"})

@login_required
def index(request):
    pokemons = Card.objects.all()
    ctx = {"pokemons": pokemons}
    return render(request, "index.html", ctx)


def card(request):
    r = requests.get("https://api.tcgdex.net/v2/en/cards/swsh3-40")
    r_json = f"{r.json().get('image')}/high.png"
    name_json = f"{r.json().get('name')}"
    rarity_json = f"{r.json().get('rarity')}"

    ctx = {"card": r_json, "name": name_json, "rarity": rarity_json}

    return render(request, "index.html", ctx)

def landing(request):
    return render(request, "index.html")

