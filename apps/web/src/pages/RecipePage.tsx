import type { Recipe } from '@olivier/core'
import { Link, useParams } from 'react-router-dom'
import { RecipeDetails } from '../components/RecipeDetails'

type RecipePageProps = {
  isLoading: boolean
  recipes: Recipe[]
}

export function RecipePage({ isLoading, recipes }: RecipePageProps) {
  const { slug } = useParams()
  const recipe = recipes.find((item) => item.slug === slug)

  if (!recipe && isLoading) {
    return (
      <section className="route-state" aria-live="polite">
        <p>Загружаем рецепт…</p>
      </section>
    )
  }

  if (!recipe) {
    return (
      <section className="route-state" aria-labelledby="recipe-not-found">
        <p className="eyebrow">Рецепт не найден</p>
        <h1 id="recipe-not-found">Похоже, такого блюда пока нет</h1>
        <Link className="secondary-button" to="/menu">Открыть каталог</Link>
      </section>
    )
  }

  return (
    <div className="recipe-page">
      <div className="route-toolbar">
        <Link className="back-link" to="/menu#recipes">← К каталогу</Link>
      </div>
      <RecipeDetails recipe={recipe} />
    </div>
  )
}
