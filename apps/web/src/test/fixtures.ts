import type { Recipe } from '@olivier/core'
import { olivierRecipe } from '../olivier'

// Fixture — это заранее подготовленный набор тестовых данных. Мы создаём второй
// рецепт на основе Оливье и меняем только важные для сценария поля. Так тесты
// остаются короткими и при этом работают с полноценным типом Recipe.
export const tomatoSoupRecipe: Recipe = {
  ...olivierRecipe,
  id: 'tomato-soup',
  slug: 'tomato-soup',
  title: 'Томатный суп',
  summary: 'Быстрый суп для домашнего обеда.',
  description: 'Лёгкий суп из спелых томатов.',
  category: { name: 'Супы', slug: 'soups' },
  totalMinutes: 30,
  difficulty: 'medium',
  isVegetarian: true,
  ingredients: [
    {
      id: 'tomato',
      name: 'Томаты',
      quantity: 600,
      unit: 'g',
      section: 'vegetables',
      sectionLabel: 'Овощи',
    },
  ],
  steps: ['Нарежьте томаты.', 'Проварите и измельчите суп блендером.'],
}
