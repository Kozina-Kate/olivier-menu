from django.db import migrations, models


KNOWN_SLUGS = {
    "картофель": "potato",
    "морковь": "carrot",
    "яйца": "eggs",
    "варёная колбаса": "cooked-sausage",
    "солёные огурцы": "pickles",
    "зелёный горошек": "green-peas",
    "майонез": "mayonnaise",
    "соль": "salt",
}


def forwards(apps, schema_editor):
    Ingredient = apps.get_model("recipes", "Ingredient")
    used_slugs = set()
    section_mapping = {
        "vegetables": "vegetables_fruit",
        "meat": "meat_fish_poultry",
        "dairy": "dairy_eggs",
    }
    for ingredient in Ingredient.objects.using(schema_editor.connection.alias).order_by("pk"):
        key = ingredient.name.strip().casefold()
        slug = KNOWN_SLUGS.get(key, f"ingredient-{ingredient.pk}")
        if slug in used_slugs:
            slug = f"ingredient-{ingredient.pk}"
        used_slugs.add(slug)
        ingredient.slug = slug
        ingredient.section = section_mapping.get(ingredient.section, ingredient.section)
        if key in {"майонез", "соль"} and ingredient.section == "grocery":
            ingredient.section = "sauces_spices"
        ingredient.save(update_fields=["slug", "section"])


def backwards(apps, schema_editor):
    Ingredient = apps.get_model("recipes", "Ingredient")
    section_mapping = {
        "vegetables_fruit": "vegetables",
        "meat_fish_poultry": "meat",
        "dairy_eggs": "dairy",
        "sauces_spices": "grocery",
    }
    for ingredient in Ingredient.objects.using(schema_editor.connection.alias).iterator():
        ingredient.section = section_mapping.get(ingredient.section, ingredient.section)
        ingredient.save(update_fields=["section"])


class Migration(migrations.Migration):
    dependencies = [("recipes", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="ingredient",
            name="slug",
            field=models.SlugField(max_length=140, null=True, unique=True, verbose_name="Устойчивый код", help_text="Не меняйте после создания: код используется клиентами API."),
        ),
        migrations.AddField(
            model_name="recipeingredient",
            name="is_required",
            field=models.BooleanField(default=True, verbose_name="Обязательный"),
        ),
        migrations.AlterField(
            model_name="ingredient",
            name="section",
            field=models.CharField(
                choices=[
                    ("meat_fish_poultry", "Мясо, рыба и птица"),
                    ("vegetables_fruit", "Овощи и фрукты"),
                    ("dairy_eggs", "Молочные продукты и яйца"),
                    ("grocery", "Бакалея"),
                    ("canned", "Консервы"),
                    ("sauces_spices", "Соусы и специи"),
                    ("other", "Другое"),
                ],
                default="other",
                max_length=24,
                verbose_name="Отдел магазина",
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="ingredient",
            name="slug",
            field=models.SlugField(max_length=140, unique=True, verbose_name="Устойчивый код", help_text="Не меняйте после создания: код используется клиентами API."),
        ),
    ]
