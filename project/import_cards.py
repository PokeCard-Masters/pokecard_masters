#!/usr/bin/env python
"""Import 100 Pokemon cards from TCGDex API into the database."""
import os
import sys
import time
import ssl
import urllib.request
import json

# Django setup
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
sys.path.insert(0, os.path.dirname(__file__))

import django
django.setup()

from app.models import Card

# Use urllib with custom SSL context to avoid SSL issues
ctx = ssl.create_default_context()

def fetch_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read().decode())

# Fetch card list
print("Fetching card list...")
cards_list = fetch_json("https://api.tcgdex.net/v2/en/cards")

count = 0
for i in cards_list:
    if count >= 100:
        break
    if "image" not in i:
        continue

    card_id = i["id"]
    name = i["name"]
    image = i["image"]

    try:
        time.sleep(0.2)
        detail = fetch_json(f"https://api.tcgdex.net/v2/en/cards/{card_id}")
        category = detail.get("category", "")
        illustrator = detail.get("illustrator")
        rarity = detail.get("rarity", "")

        obj, created = Card.objects.update_or_create(
            card_id=card_id,
            defaults={
                "name": name,
                "image": image,
                "category": category,
                "illustrator": illustrator,
                "rarity": rarity,
            },
        )
        count += 1
        status = "created" if created else "updated"
        if count % 10 == 0:
            print(f"  {count} cards imported...")
    except Exception as e:
        print(f"  Error on {card_id}: {e}")
        time.sleep(1)

print(f"Done! {count} cards imported.")
