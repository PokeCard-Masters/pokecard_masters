from django.contrib import admin
from .models import User, Card, PlayerCard

admin.site.register(User)
# Register your models here.
admin.site.register(Card)
admin.site.register(PlayerCard)
