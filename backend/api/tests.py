from django.test import TestCase


class PingViewTests(TestCase):
    def test_ping_returns_ok(self):
        url = "/api/ping/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})
