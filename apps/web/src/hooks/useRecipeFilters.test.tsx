import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { olivierRecipe } from '../olivier'
import { tomatoSoupRecipe } from '../test/fixtures'
import { useRecipeFilters } from './useRecipeFilters'

describe('useRecipeFilters', () => {
  it('ищет рецепт не только по названию, но и по ингредиенту', () => {
    // Arrange: renderHook запускает пользовательский хук без создания
    // специального тестового компонента. result.current — его текущий результат.
    const { result } = renderHook(() =>
      useRecipeFilters([olivierRecipe, tomatoSoupRecipe]),
    )

    // Act: act сообщает React, что внутри произойдёт изменение состояния.
    // После завершения блока React успевает выполнить повторный рендер хука.
    act(() => result.current.setQuery('томаты'))

    // Assert: проверяем наблюдаемый результат, а не внутреннее устройство хука.
    expect(result.current.visibleRecipes.map((recipe) => recipe.slug)).toEqual([
      'tomato-soup',
    ])
  })

  it('совмещает выбранный фильтр со строкой поиска', () => {
    const { result } = renderHook(() =>
      useRecipeFilters([olivierRecipe, tomatoSoupRecipe]),
    )

    act(() => {
      result.current.setFilter('easy')
      result.current.setQuery('оливье')
    })

    expect(result.current.visibleRecipes).toHaveLength(1)
    expect(result.current.visibleRecipes[0]?.title).toBe('Классический Оливье')
    expect(result.current.categories).toEqual([
      { name: 'Салаты', slug: 'salads' },
      { name: 'Супы', slug: 'soups' },
    ])
  })
})
