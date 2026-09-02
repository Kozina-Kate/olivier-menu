from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Category, Recipe


class RecipeApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Салаты", slug="salads")
        Recipe.objects.create(
            title="Оливье",
            slug="olivier",
            summary="Классический праздничный салат",
            category=category,
            status=Recipe.Status.PUBLISHED,
        )
        Recipe.objects.create(
            title="Черновик",
            slug="draft",
            summary="Не должен быть виден",
            category=category,
            status=Recipe.Status.DRAFT,
        )

    def test_recipe_list_contains_only_published_recipes(self):
        response = self.client.get(reverse("recipe-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["slug"], "olivier")

    def test_recipe_detail_is_available_by_slug(self):
        response = self.client.get(reverse("recipe-detail", kwargs={"slug": "olivier"}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Оливье")
