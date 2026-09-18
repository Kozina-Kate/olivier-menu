import type { Recipe } from '@olivier/core'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RecipeDetails } from '../components/RecipeDetails'

type RecipePageProps = {
  isLoading: boolean
  recipes: Recipe[]
}

export function RecipePage({ isLoading, recipes }: RecipePageProps) {
  const { slug } = useParams()
  const location = useLocation()
  const routeState = location.state as { fromPantry?: boolean; pantryRecipe?: Recipe } | null
  const pantryRecipe = routeState?.pantryRecipe
  const recipe = pantryRecipe?.slug === slug ? pantryRecipe : recipes.find((item) => item.slug === slug)

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
        <Link className="back-link" to={routeState?.fromPantry ? '/pantry#pantry-results' : '/menu#recipes'}>
          {routeState?.fromPantry ? '← К подбору рецептов' : '← К каталогу'}
        </Link>
      </div>
      <RecipeDetails recipe={recipe} />
    </div>
  )
}
