import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { olivierRecipe } from '../olivier'
import { useMenuPlanner } from './useMenuPlanner'

describe('useMenuPlanner', () => {
  it('пересчитывает ингредиенты при изменении количества гостей', () => {
    const { result } = renderHook(() => useMenuPlanner([olivierRecipe]))

    // Базовый рецепт рассчитан на 4 порции и содержит 400 г картофеля.
    expect(result.current.guests).toBe(4)
    expect(findIngredientAmount(result.current.shoppingIngredients, 'potato:g')).toBe(400)

    act(() => result.current.changeGuests(5))

    // Для 5 гостей ожидаем 400 * 5 / 4 = 500 г.
    expect(result.current.guests).toBe(5)
    expect(findIngredientAmount(result.current.shoppingIngredients, 'potato:g')).toBe(500)
    expect(result.current.shoppingText).toContain('Картофель — 500 г')
  })

  it('позволяет удалить последнее блюдо и получить пустое меню', () => {
    const { result } = renderHook(() => useMenuPlanner([olivierRecipe]))

    expect(result.current.hasMenu).toBe(true)

    act(() => result.current.toggleMenu(olivierRecipe))

    expect(result.current.hasMenu).toBe(false)
    expect(result.current.menuRecipes).toEqual([])
    expect(result.current.shoppingIngredients).toEqual([])
  })
})

// Маленькая вспомогательная функция делает ожидания в тесте выразительнее.
// Она ничего не знает о React и просто находит рассчитанное количество.
function findIngredientAmount(
  ingredients: ReturnType<typeof useMenuPlanner>['shoppingIngredients'],
  id: string,
) {
  return ingredients.find((ingredient) => ingredient.id === id)?.scaledQuantity
}
