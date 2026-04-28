from django.test import TestCase
from django.urls import reverse 

class FirstTest(TestCase):
    def test_return_200(self):
        response = self.client.get(reverse("pokemon_list"))
        self.assertEqual(response.status_code, 200)

