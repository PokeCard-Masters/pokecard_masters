from django.db import models

class pokemon(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)

class Choice(models.Model):
    choice_text = models.Charfield(max_lenght=200)
    search = models.IntegerField(default=0)
# Create your models here.
class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)
