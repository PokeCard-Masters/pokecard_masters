from django.db import models


class pokemon(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    card_id = models.CharField(max_length=200)
    image = models.CharField(max_lenght=200)


# Create your models here.


class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)


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
    type = models.CharField(choices=order_rarity)
