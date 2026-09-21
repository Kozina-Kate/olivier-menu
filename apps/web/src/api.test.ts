import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRecipeMatches } from './api'

const apiRecipe = {
  id: 7,
  title: 'Томатный суп',
  slug: 'tomato-soup',
  summary: 'Быстрый суп.',
  description: 'Суп из томатов.',
  category: { name: 'Супы', slug: 'soups' },
  base_servings: 4,
  total_minutes: 30,
  difficulty: 'easy',
  is_vegetarian: true,
  image_url: '',
  video_url: '',
  recipe_ingredients: [{
    id: 2,
    name: 'Томаты',
    quantity: '600.00',
    unit: 'g',
    section: 'vegetables_fruit',
    section_label: 'Овощи и фрукты',
    note: '',
  }],
  steps: [
    { order: 2, description: 'Измельчить.' },
    { order: 1, description: 'Нарезать.' },
  ],
}

describe('recipe matches API client', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('передаёт выбранные ID и переводит API-ответ в модель интерфейса', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [{
          recipe: apiRecipe,
          can_cook: false,
          match_percent: 50,
          matched_ingredients: [{ id: 2, slug: 'tomato', name: 'Томаты', is_required: true }],
          missing_ingredients: [{ id: 3, slug: 'eggs', name: 'Яйца', is_required: true }],
        }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const matches = await loadRecipeMatches([2, 3])

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/recipes/matches/?ingredients=2%2C3',
    )
    expect(matches).toEqual([expect.objectContaining({
      canCook: false,
      matchPercent: 50,
      matchedIngredients: [expect.objectContaining({ slug: 'tomato' })],
      missingIngredients: [expect.objectContaining({ slug: 'eggs' })],
      recipe: expect.objectContaining({
        slug: 'tomato-soup',
        steps: ['Нарезать.', 'Измельчить.'],
      }),
    })])
  })

  it('не подменяет ошибку подбора пустым результатом', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))

    await expect(loadRecipeMatches([2])).rejects.toThrow('Matches request failed: 503')
  })
})
