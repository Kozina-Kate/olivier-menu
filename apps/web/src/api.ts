import type { IngredientUnit, Recipe } from '@olivier/core'

type ApiRecipe = {
  id: number
  title: string
  slug: string
  summary: string
  description: string
  category: { name: string; slug: string }
  base_servings: number
  total_minutes: number
  difficulty: Recipe['difficulty']
  is_vegetarian: boolean
  image_url: string
  video_url: string
  recipe_ingredients: Array<{
    id: number
    name: string
    quantity: string
    unit: IngredientUnit
    section: string
    section_label: string
    note: string
  }>
  steps: Array<{ order: number; description: string }>
}

type ApiPage = {
  next: string | null
  results: ApiRecipe[]
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

function mapRecipe(data: ApiRecipe): Recipe {
  return {
    id: String(data.id),
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    category: data.category,
    baseServings: data.base_servings,
    totalMinutes: data.total_minutes,
    difficulty: data.difficulty,
    isVegetarian: data.is_vegetarian,
    imageUrl: data.image_url,
    videoUrl: data.video_url,
    ingredients: data.recipe_ingredients.map((ingredient) => ({
      id: String(ingredient.id),
      name: ingredient.name,
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit,
      section: ingredient.section,
      sectionLabel: ingredient.section_label,
      note: ingredient.note,
    })),
    steps: [...data.steps]
      .sort((left, right) => left.order - right.order)
      .map((step) => step.description),
  }
}

export async function loadRecipes(): Promise<Recipe[]> {
  const recipes: ApiRecipe[] = []
  let nextUrl: string | null = `${apiUrl}/recipes/`

  while (nextUrl) {
    const response = await fetch(nextUrl)
    if (!response.ok) throw new Error(`Recipes request failed: ${response.status}`)
    const page = (await response.json()) as ApiPage
    recipes.push(...page.results)
    nextUrl = page.next
  }

  return recipes.map(mapRecipe)
}
