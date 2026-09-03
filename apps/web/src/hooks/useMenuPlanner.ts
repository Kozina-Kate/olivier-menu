import { useCallback, useMemo, useState } from 'react'
import {
  buildMenuShoppingListText,
  combineRecipeIngredients,
  type Recipe,
} from '@olivier/core'

/** Хранит пользовательский выбор и связывает его с расчётами из core. */
export function useMenuPlanner(recipes: Recipe[]) {
  // useState подходит для значений, которые меняет сам пользователь.
  const [guests, setGuests] = useState(4)
  // Функция-инициализатор вызывается React только при первом
  // рендере. Поэтому первый рецепт попадает в меню только один раз,
  // а удалённое пользователем блюдо не добавится обратно автоматически.
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () => new Set(recipes[0] ? [recipes[0].slug] : []),
  )
  const [activeRecipeSlug, setActiveRecipeSlug] = useState(
    () => recipes[0]?.slug ?? '',
  )
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Все значения ниже являются производными. useMemo не даёт повторять
  // фильтрацию и расчёт ингредиентов при несвязанных обновлениях интерфейса.
  // effectiveSelectedSlugs также отбрасывает slug, которых нет в свежем ответе
  // API. Пустой Set остаётся пустым: это важный пользовательский выбор, а не
  // сигнал для автоматического возврата первого блюда. Для производного значения
  // effect и дополнительный setState не нужны.
  const effectiveSelectedSlugs = useMemo(() => {
    const available = new Set(recipes.map((recipe) => recipe.slug))
    return new Set([...selectedSlugs].filter((slug) => available.has(slug)))
  }, [recipes, selectedSlugs])

  const menuRecipes = useMemo(
    () => recipes.filter((recipe) => effectiveSelectedSlugs.has(recipe.slug)),
    [effectiveSelectedSlugs, recipes],
  )
  const shoppingIngredients = useMemo(
    () => combineRecipeIngredients(menuRecipes, guests),
    [guests, menuRecipes],
  )
  const shoppingText = useMemo(
    () => buildMenuShoppingListText(menuRecipes, guests),
    [guests, menuRecipes],
  )
  const activeRecipe = useMemo(
    () => recipes.find((recipe) => recipe.slug === activeRecipeSlug) ?? recipes[0],
    [activeRecipeSlug, recipes],
  )

  // useCallback запоминает саму функцию. Это удобно для обработчиков, которые
  // передаются дочерним компонентам: их ссылка не меняется без необходимости.
  const changeGuests = useCallback((next: number) => {
    setGuests(Math.min(50, Math.max(1, next)))
    setChecked(new Set())
  }, [])

  const toggleMenu = useCallback((recipe: Recipe) => {
    setSelectedSlugs((current) => {
      const available = new Set(recipes.map((item) => item.slug))
      const next = new Set([...current].filter((slug) => available.has(slug)))
      if (next.has(recipe.slug)) next.delete(recipe.slug)
      else next.add(recipe.slug)
      return next
    })
    setActiveRecipeSlug(recipe.slug)
    setChecked(new Set())
  }, [recipes])

  const openRecipe = useCallback((slug: string) => setActiveRecipeSlug(slug), [])

  const toggleChecked = useCallback((id: string) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return {
    activeRecipe,
    changeGuests,
    checked,
    guests,
    hasMenu: menuRecipes.length > 0,
    menuRecipes,
    openRecipe,
    selectedSlugs: effectiveSelectedSlugs,
    shoppingIngredients,
    shoppingText,
    toggleChecked,
    toggleMenu,
  }
}
