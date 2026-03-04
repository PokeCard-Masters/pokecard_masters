from django.urls import path
from . import views
from .api import api

urlpatterns = [
    # Path for few window on application
    path("api/pokemon/", views.import_list, name="pokemon_list"),
    path("card/", views.card, name="card"),
    ### Path for differents forms
    path("import/", views.import_api, name="import_api"),
    path("app/", views.index, name="index"),
    path("api/", api.urls),
    path('player/card/', views.view_card, name='player_card'),
]