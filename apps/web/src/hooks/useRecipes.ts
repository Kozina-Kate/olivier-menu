import { useEffect, useState } from 'react'
import type { Recipe } from '@olivier/core'
import { loadRecipes } from '../api'
import { olivierRecipe } from '../olivier'

/**
 * Пользовательский хук загрузки каталога.
 *
 * Пользовательский хук — это обычная функция, имя которой начинается с `use`.
 * Он позволяет собрать связанную логику React в одном месте и переиспользовать
 * её, не добавляя в DOM лишние компоненты.
 */
export function useRecipes() {
  // useState хранит данные между рендерами. Изменение через setRecipes просит
  // React заново отрисовать только те части интерфейса, которым нужны рецепты.
  const [recipes, setRecipes] = useState<Recipe[]>([olivierRecipe])
  const [isLoading, setIsLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  // useEffect предназначен для синхронизации с внешним миром. HTTP-запрос —
  // побочный эффект, поэтому он не выполняется прямо во время рендера.
  // Пустой массив зависимостей означает: запустить эффект после первого
  // появления компонента, а не после каждого обновления страницы.
  useEffect(() => {
    let isCurrent = true

    loadRecipes()
      .then((loadedRecipes) => {
        if (!isCurrent) return
        if (loadedRecipes.length) setRecipes(loadedRecipes)
        else setIsFallback(true)
      })
      .catch(() => {
        // При недоступном API оставляем демо-рецепт, но явно сообщаем об этом.
        if (isCurrent) setIsFallback(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    // Cleanup-функция вызывается при размонтировании. Она не отменяет запрос,
    // но не позволяет завершившемуся запросу обновить уже удалённый компонент.
    return () => {
      isCurrent = false
    }
  }, [])

  return { isLoading, isFallback, recipes }
}
