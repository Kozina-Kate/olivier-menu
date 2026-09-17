import type { Recipe } from '@olivier/core'

export const olivierRecipe: Recipe = {
  id: 'olivier', title: 'Классический Оливье', slug: 'olivier',
  summary: 'Тот самый праздничный салат — с точным расчётом на компанию.',
  description: 'Домашний Оливье с варёной колбасой, солёными огурцами и зелёным горошком.',
  category: { name: 'Салаты', slug: 'salads' },
  baseServings: 4, totalMinutes: 60, difficulty: 'easy',
  isVegetarian: false, imageUrl: '', videoUrl: '',
  ingredients: [
    { id: 'potato', name: 'Картофель', quantity: 400, unit: 'g', section: 'vegetables_fruit', sectionLabel: 'Овощи и фрукты' },
    { id: 'carrot', name: 'Морковь', quantity: 180, unit: 'g', section: 'vegetables_fruit', sectionLabel: 'Овощи и фрукты' },
    { id: 'eggs', name: 'Яйца', quantity: 4, unit: 'pcs', section: 'dairy_eggs', sectionLabel: 'Молочные продукты и яйца' },
    { id: 'cooked-sausage', name: 'Варёная колбаса', quantity: 300, unit: 'g', section: 'meat_fish_poultry', sectionLabel: 'Мясо, рыба и птица' },
    { id: 'pickles', name: 'Солёные огурцы', quantity: 200, unit: 'g', section: 'canned', sectionLabel: 'Консервы' },
    { id: 'green-peas', name: 'Зелёный горошек', quantity: 200, unit: 'g', section: 'canned', sectionLabel: 'Консервы', note: 'без жидкости' },
    { id: 'mayonnaise', name: 'Майонез', quantity: 120, unit: 'g', section: 'sauces_spices', sectionLabel: 'Соусы и специи' },
    { id: 'salt', name: 'Соль', quantity: 1, unit: 'to_taste', section: 'sauces_spices', sectionLabel: 'Соусы и специи' },
  ],
  steps: [
    'Отварите картофель и морковь в кожуре до мягкости, затем полностью остудите.',
    'Сварите яйца вкрутую, охладите в холодной воде и очистите.',
    'Нарежьте картофель, морковь, яйца, колбасу и огурцы одинаковыми кубиками.',
    'Добавьте зелёный горошек и аккуратно перемешайте ингредиенты.',
    'Перед подачей заправьте майонезом, посолите и ещё раз перемешайте.',
  ],
}
