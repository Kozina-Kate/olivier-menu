from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from recipes.models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


INGREDIENTS = [
    ("Картофель", Ingredient.Section.VEGETABLES, "400", RecipeIngredient.Unit.GRAM, ""),
    ("Морковь", Ingredient.Section.VEGETABLES, "180", RecipeIngredient.Unit.GRAM, ""),
    ("Яйца", Ingredient.Section.DAIRY, "4", RecipeIngredient.Unit.PIECE, ""),
    ("Варёная колбаса", Ingredient.Section.MEAT, "300", RecipeIngredient.Unit.GRAM, ""),
    ("Солёные огурцы", Ingredient.Section.CANNED, "200", RecipeIngredient.Unit.GRAM, ""),
    ("Зелёный горошек", Ingredient.Section.CANNED, "200", RecipeIngredient.Unit.GRAM, "без жидкости"),
    ("Майонез", Ingredient.Section.GROCERY, "120", RecipeIngredient.Unit.GRAM, ""),
    ("Соль", Ingredient.Section.GROCERY, "1", RecipeIngredient.Unit.TO_TASTE, ""),
]

STEPS = [
    "Отварите картофель и морковь в кожуре до мягкости, затем полностью остудите.",
    "Сварите яйца вкрутую, охладите в холодной воде и очистите.",
    "Нарежьте картофель, морковь, яйца, колбасу и огурцы одинаковыми небольшими кубиками.",
    "Добавьте зелёный горошек и аккуратно перемешайте ингредиенты.",
    "Перед подачей заправьте майонезом, посолите по вкусу и ещё раз перемешайте.",
]


class Command(BaseCommand):
    help = "Создаёт или обновляет стартовый рецепт салата Оливье"

    @transaction.atomic
    def handle(self, *args, **options):
        category, _ = Category.objects.update_or_create(
            slug="salads", defaults={"name": "Салаты"}
        )
        recipe, _ = Recipe.objects.update_or_create(
            slug="olivier",
            defaults={
                "title": "Классический Оливье",
                "summary": "Тот самый праздничный салат — с точным расчётом на компанию.",
                "description": (
                    "Домашний Оливье с варёной колбасой, солёными огурцами "
                    "и зелёным горошком. Базовый рецепт рассчитан на 4 порции."
                ),
                "category": category,
                "base_servings": 4,
                "prep_minutes": 25,
                "cook_minutes": 35,
                "difficulty": Recipe.Difficulty.EASY,
                "status": Recipe.Status.PUBLISHED,
            },
        )

        recipe.recipe_ingredients.all().delete()
        for order, (name, section, quantity, unit, note) in enumerate(INGREDIENTS, 1):
            ingredient, _ = Ingredient.objects.update_or_create(
                name=name, defaults={"section": section}
            )
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=Decimal(quantity),
                unit=unit,
                note=note,
                order=order,
            )

        recipe.steps.all().delete()
        RecipeStep.objects.bulk_create(
            [
                RecipeStep(recipe=recipe, order=order, description=description)
                for order, description in enumerate(STEPS, 1)
            ]
        )
        self.stdout.write(self.style.SUCCESS("Рецепт Оливье готов"))
