from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.exceptions import ValidationError
from django.forms.models import inlineformset_factory
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .admin import RecipeIngredientFormSet
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
            slug="potato", name="Картофель", section=Ingredient.Section.VEGETABLES_FRUIT
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


class IngredientApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Салаты", slug="salads")
        published = Recipe.objects.create(
            title="Салат", slug="salad", summary="Салат", category=category,
            status=Recipe.Status.PUBLISHED,
        )
        another_published = Recipe.objects.create(
            title="Другой салат", slug="other-salad", summary="Другой",
            category=category, status=Recipe.Status.PUBLISHED,
        )
        draft = Recipe.objects.create(
            title="Черновик", slug="draft", summary="Черновик",
            category=category, status=Recipe.Status.DRAFT,
        )
        chicken = Ingredient.objects.create(
            slug="chicken", name="Курица", section=Ingredient.Section.MEAT_FISH_POULTRY,
        )
        carrot = Ingredient.objects.create(
            slug="carrot", name="Морковь", section=Ingredient.Section.VEGETABLES_FRUIT,
        )
        potato = Ingredient.objects.create(
            slug="potato", name="Картофель", section=Ingredient.Section.VEGETABLES_FRUIT,
        )
        draft_only = Ingredient.objects.create(
            slug="coconut-milk", name="Кокосовое молоко", section=Ingredient.Section.CANNED,
        )
        Ingredient.objects.create(
            slug="unused", name="Неиспользуемый", section=Ingredient.Section.OTHER,
        )
        for recipe, ingredient in [
            (published, chicken), (published, potato), (published, carrot),
            (another_published, potato), (draft, draft_only),
        ]:
            RecipeIngredient.objects.create(
                recipe=recipe, ingredient=ingredient, quantity=1,
                unit=RecipeIngredient.Unit.PIECE,
            )

    def test_catalog_is_unique_public_unpaginated_and_section_ordered(self):
        response = self.client.get(reverse("ingredient-list"))

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(
            [item["slug"] for item in response.data],
            ["chicken", "potato", "carrot"],
        )
        self.assertEqual(
            response.data[1],
            {
                "id": Ingredient.objects.get(slug="potato").pk,
                "slug": "potato", "name": "Картофель",
                "section": "vegetables_fruit", "section_label": "Овощи и фрукты",
            },
        )

    def test_catalog_cannot_be_modified_through_api(self):
        response = self.client.post(reverse("ingredient-list"), {"name": "Лук"})
        self.assertEqual(response.status_code, 405)

    def test_slug_does_not_change_with_display_name(self):
        ingredient = Ingredient.objects.get(slug="potato")
        ingredient.name = "Картошка"
        ingredient.save()
        self.assertEqual(Ingredient.objects.get(pk=ingredient.pk).slug, "potato")

    def test_admin_validation_rejects_case_only_duplicate(self):
        duplicate = Ingredient(
            slug="another-potato", name=" картофель ",
            section=Ingredient.Section.VEGETABLES_FRUIT,
        )
        with self.assertRaises(ValidationError):
            duplicate.full_clean()


class RecipeMatchApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Завтраки", slug="breakfast")
        self.ingredients = {
            slug: Ingredient.objects.create(slug=slug, name=name)
            for slug, name in [
                ("eggs", "Яйца"), ("milk", "Молоко"),
                ("butter", "Масло"), ("bread", "Хлеб"),
                ("cheese", "Сыр"), ("salt", "Соль"),
                ("draft-only", "Только в черновике"),
                ("unused", "Неиспользуемый"),
            ]
        }
        self.add_recipe(
            "omelette", "Омлет", ["eggs", "milk", "butter"], ["salt"]
        )
        self.add_recipe("fried-eggs", "Яичница", ["eggs"], ["salt"])
        self.add_recipe("salad", "Салат", ["eggs", "cheese"])
        self.add_recipe("sandwich", "Сэндвич", ["eggs", "bread", "cheese"])
        self.add_recipe(
            "draft", "Черновик", ["eggs", "draft-only"],
            status=Recipe.Status.DRAFT,
        )

    def add_recipe(self, slug, title, required, optional=(), status=Recipe.Status.PUBLISHED):
        recipe = Recipe.objects.create(
            slug=slug, title=title, summary=title, category=self.category,
            status=status,
        )
        for order, ingredient_slug in enumerate([*required, *optional], 1):
            RecipeIngredient.objects.create(
                recipe=recipe, ingredient=self.ingredients[ingredient_slug],
                quantity=1, unit=RecipeIngredient.Unit.PIECE,
                is_required=ingredient_slug in required, order=order,
            )
        RecipeStep.objects.create(recipe=recipe, order=1, description="Приготовить.")
        return recipe

    def get_matches(self, *slugs):
        ingredient_ids = ",".join(
            str(self.ingredients[slug].pk) for slug in slugs
        )
        return self.client.get(reverse("recipe-matches"), {"ingredients": ingredient_ids})

    def test_full_partial_and_ranked_matches_use_recipe_detail_shape(self):
        response = self.get_matches("eggs", "milk", "butter")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 4)
        self.assertEqual(
            [item["recipe"]["slug"] for item in response.data["results"]],
            ["omelette", "fried-eggs", "salad", "sandwich"],
        )
        self.assertEqual(
            [item["match_percent"] for item in response.data["results"]],
            [100, 100, 50, 33],
        )
        self.assertEqual(
            [item["can_cook"] for item in response.data["results"]],
            [True, True, False, False],
        )
        salad = response.data["results"][2]
        self.assertEqual(
            [item["slug"] for item in salad["matched_ingredients"]], ["eggs"]
        )
        self.assertEqual(
            [item["slug"] for item in salad["missing_ingredients"]], ["cheese"]
        )
        self.assertEqual(
            set(salad["missing_ingredients"][0]),
            {"id", "slug", "name", "is_required"},
        )
        detail = self.client.get(
            reverse("recipe-detail", kwargs={"slug": "salad"})
        )
        self.assertEqual(salad["recipe"], detail.data)

    def test_optional_ingredient_is_visible_but_not_required_for_match(self):
        eggs_only = self.get_matches("eggs")
        with_optional = self.get_matches("eggs", "salt")

        self.assertEqual(eggs_only.status_code, 200)
        self.assertEqual(with_optional.status_code, 200)
        self.assertEqual(
            [item["recipe"]["slug"] for item in with_optional.data["results"]],
            [item["recipe"]["slug"] for item in eggs_only.data["results"]],
        )
        omelette = next(
            item for item in with_optional.data["results"]
            if item["recipe"]["slug"] == "omelette"
        )
        self.assertEqual(omelette["match_percent"], 33)
        self.assertEqual(
            [item["slug"] for item in omelette["matched_ingredients"]],
            ["eggs", "salt"],
        )
        self.assertFalse(omelette["matched_ingredients"][1]["is_required"])
        self.assertEqual(
            [item["slug"] for item in omelette["missing_ingredients"]],
            ["milk", "butter"],
        )
        self.assertEqual(self.get_matches("salt").data, {"count": 0, "results": []})

    def test_repeated_ids_do_not_change_the_result(self):
        single = self.get_matches("eggs")
        repeated = self.get_matches("eggs", "eggs")
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.data, single.data)

    def test_half_percent_is_rounded_up(self):
        self.add_recipe(
            "eighth", "Восьмая доля",
            ["eggs", "milk", "butter", "bread", "cheese", "salt", "draft-only", "unused"],
        )
        response = self.get_matches("eggs")
        eighth = next(
            item for item in response.data["results"]
            if item["recipe"]["slug"] == "eighth"
        )
        self.assertEqual(eighth["match_percent"], 13)

    def test_missing_empty_and_malformed_ids_have_stable_errors(self):
        endpoint = reverse("recipe-matches")
        for response in [self.client.get(endpoint), self.client.get(endpoint, {"ingredients": " "})]:
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.data, {
                "code": "ingredients_required", "invalid_values": [], "unknown_ids": [],
            })

        malformed = self.client.get(endpoint, {
            "ingredients": f"0,-1,abc,,2.5,{2**63}"
        })
        self.assertEqual(malformed.status_code, 400)
        self.assertEqual(malformed.data["code"], "invalid_ingredients")
        self.assertEqual(
            malformed.data["invalid_values"],
            ["0", "-1", "abc", "", "2.5", str(2**63)],
        )
        repeated_param = self.client.get(
            f"{endpoint}?ingredients=1&ingredients=2"
        )
        self.assertEqual(repeated_param.status_code, 400)
        self.assertEqual(repeated_param.data["code"], "invalid_ingredients")

    def test_unknown_unpublished_and_unused_ids_are_rejected(self):
        unknown = self.ingredients["unused"].pk + 1000
        response = self.client.get(reverse("recipe-matches"), {
            "ingredients": ",".join(map(str, [
                self.ingredients["eggs"].pk,
                self.ingredients["draft-only"].pk,
                self.ingredients["unused"].pk,
                unknown,
            ]))
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {
            "code": "unknown_ingredients", "invalid_values": [],
            "unknown_ids": [
                self.ingredients["draft-only"].pk,
                self.ingredients["unused"].pk,
                unknown,
            ],
        })

    def test_zero_matches_and_draft_are_not_returned(self):
        response = self.get_matches("bread")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["recipe"]["slug"], "sandwich")
        self.assertNotIn(
            "draft", [item["recipe"]["slug"] for item in self.get_matches("eggs").data["results"]]
        )
        self.assertEqual(self.get_matches("salt").data, {"count": 0, "results": []})

    def test_sort_ties_by_missing_count_then_name(self):
        self.add_recipe("four", "А Длинный", ["eggs", "milk", "bread", "cheese"])
        self.add_recipe("two", "А Короткий", ["eggs", "bread"])
        self.add_recipe("two-more", "Б Короткий", ["eggs", "bread"])

        response = self.get_matches("eggs", "milk")
        matching = [
            item["recipe"]["slug"] for item in response.data["results"]
            if item["match_percent"] == 50
        ]
        self.assertEqual(matching, ["two", "two-more", "salad", "four"])

    def test_equal_titles_have_stable_id_order(self):
        first = self.add_recipe("same-a", "Повтор", ["eggs", "bread"])
        second = self.add_recipe("same-b", "Повтор", ["eggs", "bread"])

        response = self.get_matches("eggs")
        matching = [
            item["recipe"]["id"] for item in response.data["results"]
            if item["recipe"]["title"] == "Повтор"
        ]
        self.assertEqual(matching, [first.pk, second.pk])

    def test_query_count_does_not_grow_with_recipe_count(self):
        for index in range(20):
            self.add_recipe(f"extra-{index}", f"Блюдо {index}", ["eggs", "bread"])

        with self.assertNumQueries(4):
            response = self.get_matches("eggs")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 24)

    def test_matches_endpoint_is_read_only(self):
        response = self.client.post(reverse("recipe-matches"), {"ingredients": "1"})
        self.assertEqual(response.status_code, 405)


class RecipeAdminValidationTests(TestCase):
    @override_settings(STORAGES={
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}
    })
    def test_admin_edit_page_shows_section_and_required_field(self):
        category = Category.objects.create(name="Салаты", slug="salads")
        recipe = Recipe.objects.create(
            title="Тест", slug="test", summary="Тест", category=category,
            status=Recipe.Status.PUBLISHED,
        )
        ingredient = Ingredient.objects.create(
            slug="potato", name="Картофель", section=Ingredient.Section.VEGETABLES_FRUIT,
        )
        RecipeIngredient.objects.create(
            recipe=recipe, ingredient=ingredient, quantity=100,
            unit=RecipeIngredient.Unit.GRAM,
        )
        admin = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.test", password="test-password"
        )
        self.client.force_login(admin)

        change_page = self.client.get(reverse("admin:recipes_recipe_change", args=[recipe.pk]))
        list_page = self.client.get(reverse("admin:recipes_recipe_changelist"))

        self.assertEqual(change_page.status_code, 200)
        self.assertContains(change_page, "Овощи и фрукты")
        self.assertContains(change_page, "Обязательный")
        self.assertEqual(list_page.status_code, 200)
        self.assertContains(list_page, "Обязательных")

    def test_published_recipe_needs_a_required_ingredient(self):
        category = Category.objects.create(name="Салаты", slug="salads")
        recipe = Recipe.objects.create(
            title="Тест", slug="test", summary="Тест", category=category,
            status=Recipe.Status.PUBLISHED,
        )
        ingredient = Ingredient.objects.create(
            slug="salt", name="Соль", section=Ingredient.Section.SAUCES_SPICES,
        )
        formset_class = inlineformset_factory(
            Recipe, RecipeIngredient, formset=RecipeIngredientFormSet,
            fields=("ingredient", "quantity", "unit", "is_required", "note", "order"),
            extra=1,
        )
        formset = formset_class(
            data={
                "recipe_ingredients-TOTAL_FORMS": "1",
                "recipe_ingredients-INITIAL_FORMS": "0",
                "recipe_ingredients-MIN_NUM_FORMS": "0",
                "recipe_ingredients-MAX_NUM_FORMS": "1000",
                "recipe_ingredients-0-ingredient": str(ingredient.pk),
                "recipe_ingredients-0-quantity": "1",
                "recipe_ingredients-0-unit": RecipeIngredient.Unit.TO_TASTE,
                "recipe_ingredients-0-order": "1",
            },
            instance=recipe,
        )
        self.assertFalse(formset.is_valid())
        self.assertIn("обязательный ингредиент", str(formset.non_form_errors()))


class DemoSeedTests(TestCase):
    def test_seed_reuses_product_with_legacy_name(self):
        ingredient = Ingredient.objects.create(
            slug="legacy-potato", name=" картофель ",
            section=Ingredient.Section.OTHER,
        )

        call_command("seed_olivier", verbosity=0)

        ingredient.refresh_from_db()
        self.assertEqual(ingredient.slug, "potato")
        self.assertEqual(ingredient.name, "Картофель")
        self.assertEqual(ingredient.section, Ingredient.Section.VEGETABLES_FRUIT)
        self.assertEqual(Ingredient.objects.filter(slug="potato").count(), 1)

    def test_seed_is_repeatable_and_uses_shared_ingredients(self):
        call_command("seed_demo", verbosity=0)
        published_count = Recipe.objects.filter(status=Recipe.Status.PUBLISHED).count()
        ingredient_count = Ingredient.objects.count()
        potato_id = Ingredient.objects.get(slug="potato").pk

        call_command("seed_demo", verbosity=0)

        self.assertEqual(published_count, 12)
        self.assertEqual(Recipe.objects.filter(status=Recipe.Status.PUBLISHED).count(), 12)
        self.assertEqual(Recipe.objects.filter(status=Recipe.Status.DRAFT).count(), 1)
        self.assertEqual(Ingredient.objects.count(), ingredient_count)
        self.assertEqual(ingredient_count, len({name.casefold() for name in Ingredient.objects.values_list("name", flat=True)}))
        self.assertEqual(Ingredient.objects.get(slug="potato").pk, potato_id)
        self.assertEqual(
            RecipeIngredient.objects.filter(ingredient_id=potato_id).count(), 3
        )
        self.assertFalse(
            RecipeIngredient.objects.get(
                recipe__slug="olivier", ingredient__slug="salt"
            ).is_required
        )
        public_slugs = {
            item["slug"] for item in self.client.get(reverse("ingredient-list")).data
        }
        self.assertNotIn("coconut-milk", public_slugs)
        self.assertIn("potato", public_slugs)

        for recipe in Recipe.objects.filter(status=Recipe.Status.PUBLISHED):
            self.assertTrue(recipe.steps.exists())
            self.assertTrue(recipe.recipe_ingredients.filter(is_required=True).exists())

        def required(slug):
            return set(
                RecipeIngredient.objects.filter(
                    recipe__slug=slug, is_required=True
                ).values_list("ingredient__slug", flat=True)
            )

        available = {"eggs", "milk", "butter"}
        self.assertTrue(required("omelette") <= available)  # полное совпадение
        self.assertEqual(required("egg-sandwich") & available, {"eggs"})
        self.assertEqual(len(required("egg-sandwich") - available), 2)
        self.assertFalse(any(
            required(recipe.slug) & {"coconut-milk"}
            for recipe in Recipe.objects.filter(status=Recipe.Status.PUBLISHED)
        ))  # продукт только из черновика не даёт совпадений
        self.assertFalse(any(
            "oregano" in required(recipe.slug)
            for recipe in Recipe.objects.filter(status=Recipe.Status.PUBLISHED)
        ))  # выбранная необязательная специя не даёт ложного совпадения
