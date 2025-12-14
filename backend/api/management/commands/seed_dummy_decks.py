from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Deck, Card, StudySession, TestResult


class Command(BaseCommand):
    help = "Seed a user with sample decks, cards, study sessions, and test results"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="demo",
            help="Username to seed data for (default: demo)",
        )
        parser.add_argument(
            "--password",
            default="demo1234",
            help="Password to set if creating the user (default: demo1234)",
        )
        parser.add_argument(
            "--email",
            default=None,
            help="Optional email to set if creating the user",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        email = options["email"] or f"{username}@example.com"

        # Create or fetch target user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user {username} ({username}/{password})"))
        else:
            self.stdout.write(f"User already exists: {username}")

        decks_payload = [
            {
                "name": "Algebra Basics",
                "visibility": "public",
                "cards": [
                    {"front_text": "What is the quadratic formula?", "back_text": "x = (-b ± √(b²-4ac)) / 2a"},
                    {"front_text": "Define a linear function.", "back_text": "A function of the form f(x) = mx + b"},
                ],
                "scores": [85.0, 92.0],
            },
            {
                "name": "Biology: Cell Parts",
                "visibility": "public",
                "cards": [
                    {"front_text": "What does the mitochondria do?", "back_text": "Powerhouse of the cell; produces ATP"},
                    {"front_text": "Function of ribosomes?", "back_text": "Protein synthesis"},
                ],
                "scores": [78.0, 88.0],
            },
            {
                "name": "Spanish Basics",
                "visibility": "private",
                "cards": [
                    {"front_text": "Hello", "back_text": "Hola"},
                    {"front_text": "Thank you", "back_text": "Gracias"},
                    {"front_text": "Good night", "back_text": "Buenas noches"},
                ],
                "scores": [70.0, 95.0],
            },
        ]

        for deck_payload in decks_payload:
            deck, deck_created = Deck.objects.get_or_create(
                owner=user,
                name=deck_payload["name"],
                defaults={"visibility": deck_payload["visibility"]},
            )
            if deck_created:
                self.stdout.write(self.style.SUCCESS(f"Created deck: {deck.name}"))
            else:
                # Ensure visibility matches payload
                if deck.visibility != deck_payload["visibility"]:
                    deck.visibility = deck_payload["visibility"]
                    deck.save(update_fields=["visibility"])
                self.stdout.write(f"Deck already exists: {deck.name}")

            # Seed cards if none exist yet
            if not deck.cards.exists():
                Card.objects.bulk_create(
                    [
                        Card(deck=deck, **card_payload)
                        for card_payload in deck_payload["cards"]
                    ]
                )
                self.stdout.write(self.style.SUCCESS(f"Added {len(deck_payload['cards'])} cards to {deck.name}"))
            else:
                self.stdout.write(f"Cards already present for {deck.name}, skipping")

            # Seed a few study sessions (only if none exist yet)
            if not deck.study_sessions.exists():
                now = timezone.now()
                StudySession.objects.bulk_create(
                    [
                        StudySession(user=user, deck=deck, started_at=now, ended_at=now, duration_seconds=1200),
                        StudySession(user=user, deck=deck, started_at=now - timezone.timedelta(days=1), ended_at=now - timezone.timedelta(days=1), duration_seconds=900),
                    ]
                )
                self.stdout.write(self.style.SUCCESS(f"Added study sessions for {deck.name}"))
            else:
                self.stdout.write(f"Study sessions already present for {deck.name}, skipping")

            # Seed test results (only if none exist yet)
            if not deck.test_results.exists():
                TestResult.objects.bulk_create(
                    [
                        TestResult(user=user, deck=deck, score_percent=score)
                        for score in deck_payload["scores"]
                    ]
                )
                self.stdout.write(self.style.SUCCESS(f"Added test results for {deck.name}"))
            else:
                self.stdout.write(f"Test results already present for {deck.name}, skipping")

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
