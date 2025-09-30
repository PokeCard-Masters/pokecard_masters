from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.
def json(request):
    return JsonResponse({"ping":"pong"})
