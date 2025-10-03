from django.urls import path

from . import views

urlpatterns = [
    path("card/", views.card, name="card"),
    path("health/", views.ping, name="ping"),
    path("", views.index, name="index"),
]
