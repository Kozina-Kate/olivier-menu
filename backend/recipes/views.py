from django.db.models import Prefetch
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.response import Response

from .models import Category, Ingredient, Recipe, RecipeIngredient
from .serializers import (
    CategorySerializer,
    IngredientSerializer,
    RecipeDetailSerializer,
)


def health_check(_request):
    return JsonResponse({"status": "ok"})


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
