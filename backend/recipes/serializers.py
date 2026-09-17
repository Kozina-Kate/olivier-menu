from rest_framework import serializers

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class IngredientSerializer(serializers.ModelSerializer):
    section_label = serializers.CharField(source="get_section_display", read_only=True)

    class Meta:
        model = Ingredient
        fields = ("id", "slug", "name", "section", "section_label")


class RecipeIngredientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="ingredient.id", read_only=True)
    slug = serializers.CharField(source="ingredient.slug", read_only=True)
    name = serializers.CharField(source="ingredient.name", read_only=True)
    section = serializers.CharField(source="ingredient.section", read_only=True)
    section_label = serializers.CharField(
        source="ingredient.get_section_display", read_only=True
    )
    unit_label = serializers.CharField(source="get_unit_display", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = (
            "id",
            "slug",
            "name",
            "section",
            "section_label",
            "quantity",
            "unit",
            "unit_label",
            "note",
            "is_required",
            "order",
        )


class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ("order", "description")


class RecipeListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    total_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Recipe
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "category",
            "base_servings",
            "total_minutes",
            "difficulty",
            "is_vegetarian",
            "image_url",
        )


class RecipeDetailSerializer(RecipeListSerializer):
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + (
            "description",
            "prep_minutes",
            "cook_minutes",
            "video_url",
            "recipe_ingredients",
            "steps",
            "updated_at",
        )
