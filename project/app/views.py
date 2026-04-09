from django.shortcuts import render
from django.http import JsonResponse
import requests
from .models import Card


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


def import_set_A4(request):
    r = requests.get("https://api.tcgdex.net/v2/en/sets/A4")
    r_json = r.json()
    cards = r_json["cards"]
    number = 0
    for i in cards:
        card_id = i["id"]
        r_card = requests.get(f"https://api.tcgdex.net/v2/en/cards/{card_id}")
        r_card_json = r_card.json()
        name = r_card_json["name"]
        image = r_card_json["image"]
        category = r_card_json["category"]
        illustrator = None
        types = r_card_json.get("types")
        evolution = r_card_json.get("stage", "")
        description = r_card_json.get("description")
        evolve_from = r_card_json.get("evolveFrom")
        hp = None

        if "hp" in r_card_json:
            hp = r_card_json["hp"]
        if "illustrator" in r_card_json:
            illustrator = r_card_json["illustrator"]
        rarity = r_card_json["rarity"]
        if number < 250:
            new_pokemon = Card(
                card_id=card_id,
                name=name,
                image=image,
                category=category,
                illustrator=illustrator,
                rarity=rarity,
                types=types,
                evolution=evolution,
                description=description,
                evolve_from=evolve_from,
                hp=hp,
            )
            new_pokemon.save()
            number = number + 1
        else:
            break
    return JsonResponse({"success": "ok"})


def card(request):
    r = requests.get("https://api.tcgdex.net/v2/en/cards/swsh3-40")
    r_json = f"{r.json().get('image')}/high.png"
    name_json = f"{r.json().get('name')}"
    rarity_json = f"{r.json().get('rarity')}"

    ctx = {"card": r_json, "name": name_json, "rarity": rarity_json}

    return render(request, "index.html", ctx)
