import type { IngredientUnit, Recipe } from '@olivier/core'

type ApiRecipe = {
  id: number
  title: string
  slug: string
  summary: string
  base_servings: number
  total_minutes: number
  difficulty: Recipe['difficulty']
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

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export async function loadRecipe(slug: string): Promise<Recipe> {
  const response = await fetch(`${apiUrl}/recipes/${slug}/`)
  if (!response.ok) throw new Error(`Recipe request failed: ${response.status}`)
  const data = (await response.json()) as ApiRecipe

  return {
    id: String(data.id),
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    baseServings: data.base_servings,
    totalMinutes: data.total_minutes,
    difficulty: data.difficulty,
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
