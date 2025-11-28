from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User


class PingViewTests(TestCase):
	def test_ping_returns_ok(self):
		url = "/api/ping/"
		res = self.client.get(url)
		self.assertEqual(res.status_code, 200)
		self.assertEqual(res.json(), {"status": "ok"})


class AuthTests(TestCase):
	def test_register_user(self):
		url = "/api/auth/register/"
		data = {
			"username": "testuser",
			"email": "test@example.com",
			"password": "TestPass123!",
			"password2": "TestPass123!"
		}
		res = self.client.post(url, data, content_type="application/json")
		self.assertEqual(res.status_code, 201)
		self.assertTrue(User.objects.filter(username="testuser").exists())

	def test_login_user(self):
		User.objects.create_user(username="testuser", password="TestPass123!")
		url = "/api/auth/login/"
		data = {"username": "testuser", "password": "TestPass123!"}
		res = self.client.post(url, data, content_type="application/json")
		self.assertEqual(res.status_code, 200)
		self.assertIn("access", res.json())
		self.assertIn("refresh", res.json())

	def test_me_authenticated(self):
		user = User.objects.create_user(username="testuser", password="TestPass123!")
		login_url = "/api/auth/login/"
		login_data = {"username": "testuser", "password": "TestPass123!"}
		login_res = self.client.post(login_url, login_data, content_type="application/json")
		token = login_res.json()["access"]

		me_url = "/api/auth/me/"
		res = self.client.get(me_url, HTTP_AUTHORIZATION=f"Bearer {token}")
		self.assertEqual(res.status_code, 200)
		self.assertEqual(res.json()["username"], "testuser")

	def test_me_unauthenticated(self):
		url = "/api/auth/me/"
		res = self.client.get(url)
		self.assertEqual(res.status_code, 401)
