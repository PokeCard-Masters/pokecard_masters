from django.test import TestCase, Client
from app.models import Card, User, PlayerCard
from app.authentification import create_app_jwt


class BoosterOpenTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(
            user_id="test_user_1",
            name="Test User",
            email="test@example.com",
        )
        self.token = create_app_jwt(self.user)
        # Create cards for each rarity tier
        for i in range(6):
            Card.objects.create(
                name=f"Common Card {i}",
                card_id=f"C-{i}",
                image=f"https://img/{i}",
                category="Pokemon",
                rarity="One Diamond" if i < 3 else "Two Diamond",
                illustrator="Artist",
            )
        for i in range(4):
            Card.objects.create(
                name=f"Uncommon Card {i}",
                card_id=f"U-{i}",
                image=f"https://img/u{i}",
                category="Pokemon",
                rarity="Three Diamond" if i < 2 else "Four Diamond",
                illustrator="Artist",
            )
        for i, rarity in enumerate(["One Shiny", "One Star", "Two Star"]):
            Card.objects.create(
                name=f"Rare Card {i}",
                card_id=f"R-{i}",
                image=f"https://img/r{i}",
                category="Pokemon",
                rarity=rarity,
                illustrator="Artist",
            )

    def _auth_header(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_open_booster_returns_10_cards(self):
        response = self.client.post("/api/booster/open", **self._auth_header())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 10)
        # Verify card structure
        card = data[0]
        for field in ["name", "card_id", "image", "category", "rarity", "illustrator"]:
            self.assertIn(field, card)

    def test_open_booster_saves_cards_to_collection(self):
        self.client.post("/api/booster/open", **self._auth_header())
        total_qty = sum(pc.quantity for pc in PlayerCard.objects.filter(card_user=self.user))
        self.assertEqual(total_qty, 10)

    def test_open_booster_multiple_times(self):
        """User can open multiple boosters without restriction."""
        self.client.post("/api/booster/open", **self._auth_header())
        response = self.client.post("/api/booster/open", **self._auth_header())
        self.assertEqual(response.status_code, 200)
        total_qty = sum(pc.quantity for pc in PlayerCard.objects.filter(card_user=self.user))
        self.assertEqual(total_qty, 20)

    def test_open_booster_no_cards_returns_500(self):
        Card.objects.all().delete()
        response = self.client.post("/api/booster/open", **self._auth_header())
        self.assertEqual(response.status_code, 500)
