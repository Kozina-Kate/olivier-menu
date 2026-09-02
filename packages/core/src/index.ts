export type IngredientUnit = 'g' | 'ml' | 'pcs' | 'tbsp' | 'tsp' | 'to_taste'

export type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: IngredientUnit
  section: string
  sectionLabel: string
  note?: string
}

export type Recipe = {
  id: string
  title: string
  slug: string
  summary: string
  baseServings: number
  totalMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: string[]
}

export type ScaledIngredient = Ingredient & { scaledQuantity: number }

export function scaleRecipeIngredients(recipe: Recipe, servings: number): ScaledIngredient[] {
  const multiplier = Math.max(1, servings) / recipe.baseServings
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    scaledQuantity: ingredient.quantity * multiplier,
  }))
}

function readableNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}

export function formatIngredientAmount(ingredient: ScaledIngredient): string {
  const { scaledQuantity, unit } = ingredient
  if (unit === 'to_taste') return 'по вкусу'
  if (unit === 'g' && scaledQuantity >= 1000) return `${readableNumber(scaledQuantity / 1000)} кг`
  if (unit === 'ml' && scaledQuantity >= 1000) return `${readableNumber(scaledQuantity / 1000)} л`

  const labels: Record<Exclude<IngredientUnit, 'to_taste'>, string> = {
    g: 'г', ml: 'мл', pcs: 'шт.', tbsp: 'ст. л.', tsp: 'ч. л.',
  }
  return `${readableNumber(scaledQuantity)} ${labels[unit]}`
}

export function buildShoppingListText(recipe: Recipe, servings: number): string {
  const items = scaleRecipeIngredients(recipe, servings)
    .map((ingredient) => `• ${ingredient.name} — ${formatIngredientAmount(ingredient)}`)
    .join('\n')
  return `Список продуктов на ${servings} чел.\n\n${items}\n\nМеню: ${recipe.title}`
}
