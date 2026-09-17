from recipes.models import Ingredient


def upsert_ingredient(slug, name, section):
    """Reuse a pre-existing product even when its display name has different case."""
    ingredient = Ingredient.objects.filter(slug=slug).first()
    if ingredient is None:
        ingredient = next(
            (
                item for item in Ingredient.objects.all()
                if item.name.strip().casefold() == name.casefold()
            ),
            Ingredient(slug=slug),
        )
    ingredient.slug = slug
    ingredient.section = section
    if not Ingredient.objects.filter(name=name).exclude(pk=ingredient.pk).exists():
        ingredient.name = name
    ingredient.save()
    return ingredient
