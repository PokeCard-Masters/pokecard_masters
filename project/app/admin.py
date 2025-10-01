from django.contrib import admin
from .models import User, pokemon

admin.site.register(User)
# Register your models here.
admin.site.register(pokemon)
