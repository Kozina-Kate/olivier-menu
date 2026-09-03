import { useMemo, useState } from 'react'
import type { Recipe } from '@olivier/core'

export type RecipeFilter = 'all' | 'quick' | 'easy' | `category:${string}`

/** Управляет поисковой строкой, активным фильтром и вычисляет видимый каталог. */
export function useRecipeFilters(recipes: Recipe[]) {
  // Это два независимых состояния: изменение текста не меняет выбранный фильтр.
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecipeFilter>('all')

  // useMemo запоминает результат вычисления. Список категорий пересобирается
  // только тогда, когда изменился массив recipes, а не при каждом вводе буквы.
  const categories = useMemo(() => {
    const unique = new Map<string, string>()
    recipes.forEach((recipe) => unique.set(recipe.category.slug, recipe.category.name))
    return [...unique.entries()].map(([slug, name]) => ({ slug, name }))
  }, [recipes])

  // Второй useMemo описывает производные данные. visibleRecipes не нужно
  // хранить через useState: его всегда можно однозначно получить из трёх
  // источников — recipes, query и filter.
  const visibleRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru')

    return recipes.filter((recipe) => {
      const searchable = [
        recipe.title,
        recipe.summary,
        recipe.category.name,
        ...recipe.ingredients.map((ingredient) => ingredient.name),
      ]
        .join(' ')
        .toLocaleLowerCase('ru')
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'quick' && recipe.totalMinutes <= 60) ||
        (filter === 'easy' && recipe.difficulty === 'easy') ||
        (filter.startsWith('category:') && recipe.category.slug === filter.slice(9))

      return matchesQuery && matchesFilter
    })
  }, [filter, query, recipes])

  return { categories, filter, query, setFilter, setQuery, visibleRecipes }
}
