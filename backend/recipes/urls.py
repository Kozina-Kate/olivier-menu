from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, IngredientViewSet, RecipeViewSet, health_check

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("ingredients", IngredientViewSet, basename="ingredient")
router.register("recipes", RecipeViewSet, basename="recipe")

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("", include(router.urls)),
]
