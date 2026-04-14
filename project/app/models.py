from django.db import models


class Card(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    card_id = models.CharField(max_length=100)
    image = models.CharField(max_length=200)
    category = models.CharField(max_length=50, null=True)
    rarity = models.CharField(max_length=50, null=True)
    illustrator = models.CharField(max_length=50, null=True)
    types = models.CharField(max_length=50, null=True)
    hp = models.IntegerField(null=True)
    evolution = models.CharField(max_length=20, null=True)
    description = models.TextField(null=True, max_length=200)
    evolve_from = models.CharField(max_length=100, null=True)

class User(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    pseudo = models.CharField(max_length=50, null=True)
    password = models.CharField(max_length=128, blank=True, default="")
    email = models.EmailField(max_length=200, unique=True)
    last_booster_opened = models.DateField(null=True, blank=True)
    booster_count = models.IntegerField(default=0)


class Rarity_Card(models.Model):
    order_rarity = [
        ("Common", "Common"),
        ("Unusual", "Unusual"),
        ("Rare", "Rare"),
        ("Ultra Rare", "Ultra Rare"),
        ("Ex", "Ex"),
        ("X", "X"),
        ("Full Art", "Full Art"),
        ("Shiny Gold", "Shiny Gold"),
    ]
    type = models.CharField(max_length=50, choices=order_rarity)


class PlayerCard(models.Model):
    card_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="player_cards"
    )
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)


class CardSet(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    logo = models.URLField(null=True)
    symbol = models.URLField(null=True)
    card_count_total = models.IntegerField(default=0)
    card_count_official = models.IntegerField(default=0)
