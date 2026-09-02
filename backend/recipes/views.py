from django.db.models import Prefetch
from django.http import JsonResponse
from rest_framework import viewsets

from .models import Category, Recipe, RecipeIngredient
from .serializers import (
    CategorySerializer,
    RecipeDetailSerializer,
)


def health_check(_request):
    return JsonResponse({"status": "ok"})


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


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
