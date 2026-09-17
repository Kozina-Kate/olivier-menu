from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from recipes.management.seed_utils import upsert_ingredient
from recipes.models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


# Один код и одно имя для каждого продукта во всех рецептах. Количества в
# рецептах ниже даны на указанное базовое число порций.
PRODUCTS = {
    "tomato": ("Помидоры", Ingredient.Section.VEGETABLES_FRUIT),
    "cucumber": ("Огурцы", Ingredient.Section.VEGETABLES_FRUIT),
    "onion": ("Лук", Ingredient.Section.VEGETABLES_FRUIT),
    "garlic": ("Чеснок", Ingredient.Section.VEGETABLES_FRUIT),
    "mushrooms": ("Шампиньоны", Ingredient.Section.VEGETABLES_FRUIT),
    "chicken": ("Курица", Ingredient.Section.MEAT_FISH_POULTRY),
    "feta": ("Фета", Ingredient.Section.DAIRY_EGGS),
    "cheese": ("Сыр", Ingredient.Section.DAIRY_EGGS),
    "milk": ("Молоко", Ingredient.Section.DAIRY_EGGS),
    "butter": ("Сливочное масло", Ingredient.Section.DAIRY_EGGS),
    "cottage-cheese": ("Творог", Ingredient.Section.DAIRY_EGGS),
    "bread": ("Хлеб", Ingredient.Section.GROCERY),
    "pasta": ("Макароны", Ingredient.Section.GROCERY),
    "rice": ("Рис", Ingredient.Section.GROCERY),
    "buckwheat": ("Гречка", Ingredient.Section.GROCERY),
    "flour": ("Мука", Ingredient.Section.GROCERY),
    "sugar": ("Сахар", Ingredient.Section.GROCERY),
    "olives": ("Маслины", Ingredient.Section.CANNED),
    "canned-tuna": ("Тунец консервированный", Ingredient.Section.CANNED),
    "sunflower-oil": ("Подсолнечное масло", Ingredient.Section.SAUCES_SPICES),
    "olive-oil": ("Оливковое масло", Ingredient.Section.SAUCES_SPICES),
    "tomato-paste": ("Томатная паста", Ingredient.Section.SAUCES_SPICES),
    "oregano": ("Орегано", Ingredient.Section.SAUCES_SPICES),
    "water": ("Вода", Ingredient.Section.OTHER),
    "coconut-milk": ("Кокосовое молоко", Ingredient.Section.CANNED),
}

# (код продукта, количество, единица, обязательный ли, примечание)
G = RecipeIngredient.Unit.GRAM
ML = RecipeIngredient.Unit.MILLILITER
PCS = RecipeIngredient.Unit.PIECE
TSP = RecipeIngredient.Unit.TEASPOON

RECIPES = [
    {
        "slug": "tomato-cucumber-salad", "title": "Салат из помидоров и огурцов",
        "category": ("salads", "Салаты"), "summary": "Свежий овощной салат на каждый день.",
        "description": "Простой салат из свежих овощей с маслом.",
        "servings": 2, "prep": 10, "cook": 0, "vegetarian": True,
        "ingredients": [("tomato", "250", G, True, ""), ("cucumber", "200", G, True, ""),
                        ("onion", "40", G, False, ""), ("sunflower-oil", "15", ML, True, ""),
                        ("salt", "1", TSP, False, "по вкусу")],
        "steps": ["Нарежьте помидоры и огурцы.", "Добавьте лук по желанию, заправьте маслом и перемешайте."],
    },
    {
        "slug": "greek-salad", "title": "Греческий салат",
        "category": ("salads", "Салаты"), "summary": "Овощи, фета и маслины с оливковым маслом.",
        "description": "Салат из свежих овощей с сыром и маслинами.",
        "servings": 2, "prep": 15, "cook": 0, "vegetarian": True,
        "ingredients": [("tomato", "250", G, True, ""), ("cucumber", "200", G, True, ""),
                        ("feta", "120", G, True, ""), ("olives", "60", G, True, ""),
                        ("olive-oil", "20", ML, True, ""), ("onion", "40", G, False, ""),
                        ("oregano", "1", TSP, False, "")],
        "steps": ["Крупно нарежьте овощи и фету.", "Добавьте маслины и заправьте оливковым маслом."],
    },
    {
        "slug": "egg-sandwich", "title": "Сэндвич с яйцом и сыром",
        "category": ("breakfast", "Завтраки"), "summary": "Сытный горячий сэндвич за 15 минут.",
        "description": "Яйцо и сыр между ломтиками поджаренного хлеба.",
        "servings": 2, "prep": 5, "cook": 10, "vegetarian": True,
        "ingredients": [("bread", "4", PCS, True, "ломтика"), ("eggs", "2", PCS, True, ""),
                        ("cheese", "60", G, True, ""), ("butter", "10", G, False, "")],
        "steps": ["Приготовьте яйца на сковороде.", "Соберите сэндвич с сыром и прогрейте до расплавления."],
    },
    {
        "slug": "omelette", "title": "Омлет с молоком",
        "category": ("breakfast", "Завтраки"), "summary": "Нежный омлет из трёх продуктов.",
        "description": "Классический омлет на сковороде.",
        "servings": 2, "prep": 5, "cook": 10, "vegetarian": True,
        "ingredients": [("eggs", "4", PCS, True, ""), ("milk", "80", ML, True, ""),
                        ("butter", "15", G, True, ""), ("salt", "1", TSP, False, "по вкусу")],
        "steps": ["Взбейте яйца с молоком.", "Вылейте смесь на сковороду с маслом и готовьте под крышкой."],
    },
    {
        "slug": "pasta-tomato", "title": "Макароны с томатным соусом",
        "category": ("hot", "Горячее"), "summary": "Быстрые макароны с домашним томатным соусом.",
        "description": "Макароны с соусом из помидоров, пасты и чеснока.",
        "servings": 2, "prep": 10, "cook": 20, "vegetarian": True,
        "ingredients": [("pasta", "200", G, True, ""), ("tomato", "200", G, True, ""),
                        ("tomato-paste", "40", G, True, ""), ("garlic", "2", PCS, True, "зубчика"),
                        ("olive-oil", "15", ML, True, ""), ("salt", "1", TSP, False, "по вкусу")],
        "steps": ["Отварите макароны до готовности.", "Прогрейте помидоры, пасту и чеснок в масле; соедините с макаронами."],
    },
    {
        "slug": "rice-vegetables", "title": "Рис с овощами",
        "category": ("sides", "Гарниры"), "summary": "Рис с морковью и зелёным горошком.",
        "description": "Универсальный овощной гарнир.",
        "servings": 3, "prep": 10, "cook": 25, "vegetarian": True,
        "ingredients": [("rice", "220", G, True, ""), ("carrot", "120", G, True, ""),
                        ("green-peas", "120", G, True, "без жидкости"), ("onion", "60", G, False, ""),
                        ("sunflower-oil", "20", ML, True, "")],
        "steps": ["Отварите рис.", "Обжарьте морковь и лук, добавьте горошек и смешайте с рисом."],
    },
    {
        "slug": "buckwheat-mushrooms", "title": "Гречка с грибами",
        "category": ("sides", "Гарниры"), "summary": "Гречка с шампиньонами и луком.",
        "description": "Сытный гарнир из крупы и грибов.",
        "servings": 3, "prep": 10, "cook": 25, "vegetarian": True,
        "ingredients": [("buckwheat", "220", G, True, ""), ("mushrooms", "250", G, True, ""),
                        ("onion", "80", G, True, ""), ("sunflower-oil", "20", ML, True, "")],
        "steps": ["Отварите гречку.", "Обжарьте грибы с луком и соедините с гречкой."],
    },
    {
        "slug": "chicken-soup", "title": "Куриный суп",
        "category": ("soups", "Супы"), "summary": "Простой суп с курицей и овощами.",
        "description": "Домашний куриный суп с картофелем и морковью.",
        "servings": 4, "prep": 15, "cook": 45, "vegetarian": False,
        "ingredients": [("chicken", "400", G, True, ""), ("potato", "300", G, True, ""),
                        ("carrot", "120", G, True, ""), ("onion", "80", G, True, ""),
                        ("water", "1500", ML, True, ""), ("salt", "1", TSP, False, "по вкусу")],
        "steps": ["Сварите курицу до готовности.", "Добавьте нарезанные овощи и варите до мягкости."],
    },
    {
        "slug": "baked-chicken-potatoes", "title": "Курица с картофелем в духовке",
        "category": ("hot", "Горячее"), "summary": "Курица и картофель на одном противне.",
        "description": "Запечённая курица с картофелем и чесноком.",
        "servings": 4, "prep": 15, "cook": 50, "vegetarian": False,
        "ingredients": [("chicken", "700", G, True, ""), ("potato", "600", G, True, ""),
                        ("garlic", "3", PCS, True, "зубчика"), ("sunflower-oil", "25", ML, True, ""),
                        ("salt", "1", TSP, False, "по вкусу")],
        "steps": ["Нарежьте картофель и смешайте с курицей, чесноком и маслом.", "Запекайте при 190 °C до готовности курицы и картофеля."],
    },
    {
        "slug": "tuna-salad", "title": "Салат с тунцом и яйцом",
        "category": ("salads", "Салаты"), "summary": "Салат с консервированным тунцом и огурцом.",
        "description": "Быстрый салат с рыбой, яйцами и свежим огурцом.",
        "servings": 2, "prep": 15, "cook": 10, "vegetarian": False,
        "ingredients": [("canned-tuna", "160", G, True, "без жидкости"), ("eggs", "2", PCS, True, ""),
                        ("cucumber", "180", G, True, ""), ("mayonnaise", "40", G, True, "")],
        "steps": ["Сварите яйца вкрутую и нарежьте вместе с огурцом.", "Добавьте тунец, заправьте майонезом и перемешайте."],
    },
    {
        "slug": "syrniki", "title": "Сырники",
        "category": ("breakfast", "Завтраки"), "summary": "Домашние сырники из творога.",
        "description": "Мягкие творожные сырники на сковороде.",
        "servings": 3, "prep": 15, "cook": 15, "vegetarian": True,
        "ingredients": [("cottage-cheese", "400", G, True, ""), ("eggs", "1", PCS, True, ""),
                        ("flour", "70", G, True, ""), ("sugar", "25", G, False, ""),
                        ("sunflower-oil", "20", ML, True, "")],
        "steps": ["Смешайте творог с яйцом и мукой; добавьте сахар по желанию.", "Сформируйте сырники и обжарьте с двух сторон."],
    },
    {
        "slug": "coconut-chicken-draft", "title": "Курица с кокосовым молоком",
        "category": ("hot", "Горячее"), "summary": "Черновик для проверки фильтрации.",
        "description": "Неопубликованный демонстрационный рецепт.",
        "servings": 2, "prep": 10, "cook": 25, "vegetarian": False,
        "status": Recipe.Status.DRAFT,
        "ingredients": [("chicken", "300", G, True, ""), ("coconut-milk", "200", ML, True, "")],
        "steps": ["Нарежьте курицу.", "Потушите курицу с кокосовым молоком."],
    },
]


class Command(BaseCommand):
    help = "Создаёт или обновляет 12 опубликованных рецептов и один черновик"

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_olivier", stdout=self.stdout)
        products = {
            ingredient.slug: ingredient
            for ingredient in Ingredient.objects.filter(
                slug__in={item[0] for recipe in RECIPES for item in recipe["ingredients"]}
            )
        }
        for slug, (name, section) in PRODUCTS.items():
            ingredient = upsert_ingredient(slug, name, section)
            products[slug] = ingredient

        for data in RECIPES:
            category_slug, category_name = data["category"]
            category, _ = Category.objects.update_or_create(
                slug=category_slug, defaults={"name": category_name}
            )
            recipe, _ = Recipe.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "title": data["title"], "summary": data["summary"],
                    "description": data["description"], "category": category,
                    "base_servings": data["servings"], "prep_minutes": data["prep"],
                    "cook_minutes": data["cook"], "difficulty": Recipe.Difficulty.EASY,
                    "is_vegetarian": data["vegetarian"],
                    "status": data.get("status", Recipe.Status.PUBLISHED),
                },
            )
            recipe.recipe_ingredients.all().delete()
            RecipeIngredient.objects.bulk_create([
                RecipeIngredient(
                    recipe=recipe, ingredient=products[slug], quantity=Decimal(quantity),
                    unit=unit, is_required=is_required, note=note, order=order,
                )
                for order, (slug, quantity, unit, is_required, note)
                in enumerate(data["ingredients"], 1)
            ])
            recipe.steps.all().delete()
            RecipeStep.objects.bulk_create([
                RecipeStep(recipe=recipe, order=order, description=description)
                for order, description in enumerate(data["steps"], 1)
            ])

        self.stdout.write(self.style.SUCCESS("Демонстрационный набор готов: 12 рецептов и 1 черновик"))
