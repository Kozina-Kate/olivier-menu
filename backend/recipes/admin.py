from django.contrib import admin
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from django.forms.models import BaseInlineFormSet

from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        if any(form.errors for form in self.forms):
            return

        ingredients = [
            form.cleaned_data
            for form in self.forms
            if form.cleaned_data and not form.cleaned_data.get("DELETE")
        ]
        ingredient_ids = [
            item["ingredient"].pk for item in ingredients if item.get("ingredient")
        ]
        if len(ingredient_ids) != len(set(ingredient_ids)):
            raise ValidationError("Один продукт нельзя добавить в рецепт дважды.")
        if (
            self.instance.status == Recipe.Status.PUBLISHED
            and not any(item.get("is_required") for item in ingredients)
        ):
            raise ValidationError(
                "Опубликованный рецепт должен содержать обязательный ингредиент."
            )


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    formset = RecipeIngredientFormSet
    extra = 1
    autocomplete_fields = ["ingredient"]
    fields = ("ingredient", "section_label", "quantity", "unit", "is_required", "note", "order")
    readonly_fields = ("section_label",)

    @admin.display(description="Отдел магазина")
    def section_label(self, obj):
        return obj.ingredient.get_section_display() if obj.pk else "—"


class RecipeStepInline(admin.StackedInline):
    model = RecipeStep
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = (
        "title", "category", "status", "required_count", "ingredient_count",
        "step_count", "base_servings", "difficulty", "updated_at",
    )
    list_filter = ("status", "category", "difficulty", "is_vegetarian")
    search_fields = ("title", "summary", "recipe_ingredients__ingredient__name")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    list_select_related = ("category",)
    inlines = [RecipeIngredientInline, RecipeStepInline]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _ingredient_count=Count("recipe_ingredients", distinct=True),
            _required_count=Count(
                "recipe_ingredients",
                filter=Q(recipe_ingredients__is_required=True),
                distinct=True,
            ),
            _step_count=Count("steps", distinct=True),
        )

    @admin.display(description="Обязательных", ordering="_required_count")
    def required_count(self, obj):
        return obj._required_count

    @admin.display(description="Продуктов", ordering="_ingredient_count")
    def ingredient_count(self, obj):
        return obj._ingredient_count

    @admin.display(description="Шагов", ordering="_step_count")
    def step_count(self, obj):
        return obj._step_count


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "section")
    list_filter = ("section",)
    search_fields = ("name", "slug")

    def get_readonly_fields(self, request, obj=None):
        return ("slug",) if obj else ()


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
