from django.db import models

# Create your models here.
class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)
    pokemons = models.ManyToManyField("Pokemon", blank=True)

class pokemon(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=20)
    card_id = models.CharField(max_length=10)
    image = models.CharField(max_length=200)