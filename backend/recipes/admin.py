from django.contrib import admin

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1
    autocomplete_fields = ["ingredient"]


class RecipeStepInline(admin.StackedInline):
    model = RecipeStep
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "base_servings", "difficulty", "status", "updated_at")
    list_filter = ("status", "category", "difficulty", "is_vegetarian")
    search_fields = ("title", "summary", "recipe_ingredients__ingredient__name")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    inlines = [RecipeIngredientInline, RecipeStepInline]


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "section")
    list_filter = ("section",)
    search_fields = ("name",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
