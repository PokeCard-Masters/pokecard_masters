from django.urls import path
from . import views
from .api import api

urlpatterns = [
    path("api/pokemon/", views.import_list, name="pokemon_list"),
    path("card/", views.card, name="card"),
    path("import/", views.import_api, name="import_api"),
    path("api/", api.urls),
    path("", views.home_page, name="home_page")
]   