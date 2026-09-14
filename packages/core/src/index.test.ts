import { describe, expect, it } from 'vitest'
import {
  buildMenuShoppingListText,
  combineRecipeIngredients,
  formatIngredientAmount,
  scaleRecipeIngredients,
  type Ingredient,
  type Recipe,
} from './index'

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: 'potato',
    name: 'Картофель',
    quantity: 400,
    unit: 'g',
    section: 'vegetables',
    sectionLabel: 'Овощи и зелень',
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    title: 'Оливье',
    slug: 'olivier',
    summary: 'Салат',
    description: '',
    category: { name: 'Салаты', slug: 'salads' },
    baseServings: 4,
    totalMinutes: 60,
    difficulty: 'easy',
    isVegetarian: false,
    imageUrl: '',
    videoUrl: '',
    ingredients: [makeIngredient()],
    steps: [],
    ...overrides,
  }
}

describe('scaleRecipeIngredients', () => {
  it('scales quantities relative to the recipe base servings', () => {
    const recipe = makeRecipe({ baseServings: 2 })

    const [ingredient] = scaleRecipeIngredients(recipe, 5)

    expect(ingredient?.scaledQuantity).toBe(1000)
    expect(recipe.ingredients[0]?.quantity).toBe(400)
  })

  it('uses one serving as the lower boundary', () => {
    const [ingredient] = scaleRecipeIngredients(makeRecipe(), 0)

    expect(ingredient?.scaledQuantity).toBe(100)
  })
})

describe('combineRecipeIngredients', () => {
  it('combines the same ingredient and unit across recipes', () => {
    const salad = makeRecipe()
    const soup = makeRecipe({
      id: 'recipe-2',
      slug: 'soup',
      title: 'Суп',
      baseServings: 2,
      ingredients: [makeIngredient({ quantity: 100 })],
    })

    const result = combineRecipeIngredients([salad, soup], 4)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'potato:g', scaledQuantity: 600 })
  })

  it('keeps different units as separate shopping-list rows', () => {
    const grams = makeRecipe()
    const pieces = makeRecipe({
      id: 'recipe-2',
      slug: 'baked-potato',
      ingredients: [makeIngredient({ quantity: 4, unit: 'pcs' })],
    })

    const result = combineRecipeIngredients([grams, pieces], 4)

    expect(result.map(({ id }) => id)).toEqual(['potato:g', 'potato:pcs'])
  })

  it('does not add together quantities measured to taste', () => {
    const salt = makeIngredient({
      id: 'salt',
      name: 'Соль',
      quantity: 1,
      unit: 'to_taste',
      section: 'grocery',
      sectionLabel: 'Бакалея',
    })
    const first = makeRecipe({ ingredients: [salt] })
    const second = makeRecipe({ id: 'recipe-2', slug: 'soup', ingredients: [salt] })

    const [result] = combineRecipeIngredients([first, second], 4)

    expect(result?.scaledQuantity).toBe(1)
    expect(result && formatIngredientAmount(result)).toBe('по вкусу')
  })

  it('sorts by store section and then by ingredient name', () => {
    const recipe = makeRecipe({
      ingredients: [
        makeIngredient({ id: 'zucchini', name: 'Кабачок' }),
        makeIngredient({ id: 'potato', name: 'Картофель' }),
        makeIngredient({
          id: 'salt',
          name: 'Соль',
          section: 'grocery',
          sectionLabel: 'Бакалея',
        }),
      ],
    })

    const result = combineRecipeIngredients([recipe], 4)

    expect(result.map(({ name }) => name)).toEqual(['Соль', 'Кабачок', 'Картофель'])
  })
})

describe('formatIngredientAmount', () => {
  it.each([
    {
      caseName: 'converts grams to kilograms',
      ingredient: makeIngredient({ unit: 'g' }),
      scaledQuantity: 1250,
      expected: '1,25 кг',
    },
    {
      caseName: 'converts milliliters to liters',
      ingredient: makeIngredient({ unit: 'ml' }),
      scaledQuantity: 1500,
      expected: '1,5 л',
    },
    {
      caseName: 'rounds fractional pieces to two digits',
      ingredient: makeIngredient({ unit: 'pcs' }),
      scaledQuantity: 2.345,
      expected: '2,35 шт.',
    },
  ] satisfies Array<{
    caseName: string
    ingredient: Ingredient
    scaledQuantity: number
    expected: string
  }>)(
    '$caseName',
    ({ ingredient, scaledQuantity, expected }) => {
      expect(
        formatIngredientAmount({ ...ingredient, scaledQuantity }),
      ).toBe(expected)
    },
  )
})

describe('buildMenuShoppingListText', () => {
  it('includes the scaled combined list and all menu titles', () => {
    const salad = makeRecipe()
    const soup = makeRecipe({ id: 'recipe-2', slug: 'soup', title: 'Суп' })

    const result = buildMenuShoppingListText([salad, soup], 4)

    expect(result).toContain('Картофель — 800 г')
    expect(result).toContain('Меню: Оливье, Суп')
  })
})
