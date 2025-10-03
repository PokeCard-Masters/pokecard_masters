from django.db import models

# Create your models here.
class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)
    pokemons = models.ManyToManyField("Pokemon", blank=True)

class pokemon(models.Model):
    id = models.AutoField(primary_key=True)
    card_id = models.IntegerField(max_length=100)
    name = models.CharField(max_length=200)
    image = models.CharField(null=True)