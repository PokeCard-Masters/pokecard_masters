from django.shortcuts import render
from django.http import JsonResponse
import requests

# Create your views here.
def ping(request):
    return JsonResponse({"ping":"pong"})

def index(request):
    return render(request, 'index.html')

def card(request):
    r = requests.get('https://api.tcgdex.net/v2/en/cards/swsh3-40')
    r_json = f'{r.json().get("image")}/high.png'
    name_json = f'{r.json().get("name")}'
    rarity_json = f'{r.json().get("rarity")}'

    ctx = {
        'card': r_json,
        'name': name_json,
        'rarity': rarity_json 
        }
    
    return render(request,'index.html',ctx)