from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


class RecipeApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Салаты", slug="salads")
        self.olivier = Recipe.objects.create(
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
        potato = Ingredient.objects.create(
            name="Картофель", section=Ingredient.Section.VEGETABLES
        )
        RecipeIngredient.objects.create(
            recipe=self.olivier,
            ingredient=potato,
            quantity=400,
            unit=RecipeIngredient.Unit.GRAM,
        )
        RecipeStep.objects.create(
            recipe=self.olivier, order=1, description="Отварить овощи."
        )

    def test_recipe_list_contains_only_published_recipes(self):
        response = self.client.get(reverse("recipe-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["slug"], "olivier")
        self.assertEqual(
            response.data["results"][0]["recipe_ingredients"][0]["name"],
            "Картофель",
        )
        self.assertEqual(
            response.data["results"][0]["steps"][0]["description"],
            "Отварить овощи.",
        )

    def test_recipe_detail_is_available_by_slug(self):
        response = self.client.get(reverse("recipe-detail", kwargs={"slug": "olivier"}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Оливье")
