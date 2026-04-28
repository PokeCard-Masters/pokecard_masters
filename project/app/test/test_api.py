from django.test import TestCase
from django.urls import reverse 

class ApiTest(TestCase):
    def test_hello(self):
        response = self.client.get(reverse("hello"))
        self.assertEqual(response.status_code, 200)