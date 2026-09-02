from django.core.validators import MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField("Название", max_length=100, unique=True)
    slug = models.SlugField("Адрес", max_length=120, unique=True)

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    class Section(models.TextChoices):
        VEGETABLES = "vegetables", "Овощи и зелень"
        MEAT = "meat", "Мясо и птица"
        DAIRY = "dairy", "Молочные продукты и яйца"
        GROCERY = "grocery", "Бакалея"
        CANNED = "canned", "Консервы"
        OTHER = "other", "Другое"

    name = models.CharField("Название", max_length=120, unique=True)
    section = models.CharField(
        "Отдел магазина", max_length=20, choices=Section.choices, default=Section.OTHER
    )

    class Meta:
        verbose_name = "Ингредиент"
        verbose_name_plural = "Ингредиенты"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Recipe(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Легко"
        MEDIUM = "medium", "Средне"
        HARD = "hard", "Сложно"

    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        PUBLISHED = "published", "Опубликован"

    title = models.CharField("Название", max_length=160)
    slug = models.SlugField("Адрес", max_length=180, unique=True)
    summary = models.CharField("Краткое описание", max_length=280)
    description = models.TextField("Описание", blank=True)
    category = models.ForeignKey(
        Category,
        verbose_name="Категория",
        related_name="recipes",
        on_delete=models.PROTECT,
    )
    base_servings = models.PositiveSmallIntegerField(
        "Базовое количество порций", default=4, validators=[MinValueValidator(1)]
    )
    prep_minutes = models.PositiveSmallIntegerField("Подготовка, минут", default=15)
    cook_minutes = models.PositiveSmallIntegerField("Приготовление, минут", default=30)
    difficulty = models.CharField(
        "Сложность", max_length=10, choices=Difficulty.choices, default=Difficulty.EASY
    )
    is_vegetarian = models.BooleanField("Вегетарианское", default=False)
    image_url = models.URLField("Ссылка на фотографию", blank=True)
    video_url = models.URLField("Ссылка на видео", blank=True)
    status = models.CharField(
        "Статус", max_length=12, choices=Status.choices, default=Status.DRAFT
    )
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлён", auto_now=True)

    class Meta:
        verbose_name = "Рецепт"
        verbose_name_plural = "Рецепты"
        ordering = ["title"]

    def __str__(self):
        return self.title

    @property
    def total_minutes(self):
        return self.prep_minutes + self.cook_minutes


class RecipeIngredient(models.Model):
    class Unit(models.TextChoices):
        GRAM = "g", "г"
        MILLILITER = "ml", "мл"
        PIECE = "pcs", "шт."
        TABLESPOON = "tbsp", "ст. л."
        TEASPOON = "tsp", "ч. л."
        TO_TASTE = "to_taste", "по вкусу"

    recipe = models.ForeignKey(
        Recipe, related_name="recipe_ingredients", on_delete=models.CASCADE
    )
    ingredient = models.ForeignKey(
        Ingredient, related_name="recipe_ingredients", on_delete=models.PROTECT
    )
    quantity = models.DecimalField(
        "Количество", max_digits=8, decimal_places=2, validators=[MinValueValidator(0)]
    )
    unit = models.CharField("Единица", max_length=12, choices=Unit.choices)
    note = models.CharField("Примечание", max_length=160, blank=True)
    order = models.PositiveSmallIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Ингредиент рецепта"
        verbose_name_plural = "Ингредиенты рецепта"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.recipe}: {self.ingredient}"


class RecipeStep(models.Model):
    recipe = models.ForeignKey(Recipe, related_name="steps", on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField("Номер шага", default=1)
    description = models.TextField("Описание")

    class Meta:
        verbose_name = "Шаг приготовления"
        verbose_name_plural = "Шаги приготовления"
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "order"], name="unique_recipe_step_order"
            )
        ]

    def __str__(self):
        return f"{self.recipe}: шаг {self.order}"
