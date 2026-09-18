from django.db.models import Prefetch
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Ingredient, Recipe, RecipeIngredient
from .serializers import (
    CategorySerializer,
    IngredientSerializer,
    RecipeDetailSerializer,
)


def health_check(_request):
    return JsonResponse({"status": "ok"})


def match_error(code, invalid_values=None, unknown_ids=None):
    return Response(
        {
            "code": code,
            "invalid_values": invalid_values or [],
            "unknown_ids": unknown_ids or [],
        },
        status=400,
    )


def parse_ingredient_ids(values):
    if not values or (len(values) == 1 and not values[0].strip()):
        return [], [], "ingredients_required"
    if len(values) != 1:
        return [], values, "invalid_ingredients"

    ids = []
    seen_ids = set()
    invalid_values = []
    for value in values[0].split(","):
        token = value.strip()
        if not token.isascii() or not token.isdecimal():
            invalid_values.append(token)
            continue
        try:
            ingredient_id = int(token)
        except ValueError:  # Слишком длинное число тоже считается неверным ID.
            invalid_values.append(token)
            continue
        if not 0 < ingredient_id <= 9223372036854775807:
            invalid_values.append(token)
        elif ingredient_id not in seen_ids:
            ids.append(ingredient_id)
            seen_ids.add(ingredient_id)

    if invalid_values:
        return [], invalid_values, "invalid_ingredients"
    return ids, [], None


def match_ingredient(item):
    return {
        "id": item.ingredient_id,
        "slug": item.ingredient.slug,
        "name": item.ingredient.name,
        "is_required": item.is_required,
    }


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IngredientSerializer
    pagination_class = None

    def get_queryset(self):
        return Ingredient.objects.filter(
            recipe_ingredients__recipe__status=Recipe.Status.PUBLISHED
        ).distinct()

    def list(self, request, *args, **kwargs):
        # Python casefold сортирует кириллицу одинаково на SQLite и PostgreSQL.
        section_order = {
            section: index for index, section in enumerate(Ingredient.Section.values)
        }
        ingredients = sorted(
            self.get_queryset(),
            key=lambda item: (
                section_order.get(item.section, len(section_order)),
                item.name.casefold(),
                item.pk,
            ),
        )
        return Response(self.get_serializer(ingredients, many=True).data)


class RecipeViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"
    filterset_fields = {
        "category__slug": ["exact"],
        "difficulty": ["exact"],
        "is_vegetarian": ["exact"],
    }
    search_fields = ["title", "summary", "recipe_ingredients__ingredient__name"]
    ordering_fields = ["title", "prep_minutes", "cook_minutes", "updated_at"]
    ordering = ["title"]

    def get_queryset(self):
        return (
            Recipe.objects.filter(status=Recipe.Status.PUBLISHED)
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "recipe_ingredients",
                    queryset=RecipeIngredient.objects.select_related("ingredient"),
                ),
                "steps",
            )
            .distinct()
        )

    def get_serializer_class(self):
        # Каталог сразу получает полные рецепты: так веб-приложение и будущий
        # мобильный клиент могут собрать меню без отдельного запроса на каждое блюдо.
        return RecipeDetailSerializer

    @action(detail=False, methods=["get"])
    def matches(self, request):
        selected_ids, invalid_values, error_code = parse_ingredient_ids(
            request.query_params.getlist("ingredients")
        )
        if error_code:
            return match_error(error_code, invalid_values=invalid_values)

        public_ids = set(
            Ingredient.objects.filter(
                pk__in=selected_ids,
                recipe_ingredients__recipe__status=Recipe.Status.PUBLISHED,
            ).values_list("pk", flat=True)
        )
        unknown_ids = [
            ingredient_id for ingredient_id in selected_ids
            if ingredient_id not in public_ids
        ]
        if unknown_ids:
            return match_error("unknown_ingredients", unknown_ids=unknown_ids)

        selected = set(selected_ids)
        recipes = self.get_queryset().filter(
            recipe_ingredients__ingredient_id__in=selected,
            recipe_ingredients__is_required=True,
        ).distinct()
        results = []
        for recipe in recipes:
            ingredients = list(recipe.recipe_ingredients.all())
            required = [item for item in ingredients if item.is_required]
            matched_required = [
                item for item in required if item.ingredient_id in selected
            ]
            if not matched_required:
                continue
            missing = [item for item in required if item.ingredient_id not in selected]
            matched = [item for item in ingredients if item.ingredient_id in selected]
            # Обычное арифметическое округление .5 вверх, независимо от float.
            percent = (
                200 * len(matched_required) + len(required)
            ) // (2 * len(required))
            results.append({
                "recipe": self.get_serializer(recipe).data,
                "can_cook": not missing,
                "match_percent": percent,
                "matched_ingredients": [match_ingredient(item) for item in matched],
                "missing_ingredients": [match_ingredient(item) for item in missing],
            })

        results.sort(key=lambda item: (
            not item["can_cook"],
            -item["match_percent"],
            len(item["missing_ingredients"]),
            item["recipe"]["title"].casefold(),
            item["recipe"]["id"],
        ))
        return Response({"count": len(results), "results": results})
