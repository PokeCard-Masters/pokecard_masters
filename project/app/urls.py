from django.urls import path
from . import views
from .api import api

urlpatterns = [
    # Path for few window on application

    path("api/pokemon/", views.import_list, name="pokemon_list"),
    path("card/", views.card, name="card"),
    ## Path for learn to manipulate CRUD data : PUT, GET, POST, DELETE

    ### Path for differents forms
    path("register/", views.register, name="register"),
    #path("login", views.login_view, name="login_view"),

    #### Path for make import btw bdd and API

    path("import/", views.import_api, name="import_api"),
    path("api/pokemon/", views.import_list, name="pokemon_list"),
    path("", views.landing, name="landing"),
    path("app/", views.index, name="index"),

    path("api/", api.urls),

]
