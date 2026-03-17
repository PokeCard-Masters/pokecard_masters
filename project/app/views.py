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

def card(request):
    r = requests.get("https://api.tcgdex.net/v2/en/cards/swsh3-40")
    r_json = f"{r.json().get('image')}/high.png"
    name_json = f"{r.json().get('name')}"
    rarity_json = f"{r.json().get('rarity')}"

    ctx = {"card": r_json, "name": name_json, "rarity": rarity_json}

    return render(request, "index.html", ctx)
