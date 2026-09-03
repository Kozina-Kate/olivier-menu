import type { Recipe } from '@olivier/core'

type RecipeDetailsProps = { recipe?: Recipe }

/** Детальная карточка выбранного рецепта. */
export function RecipeDetails({ recipe }: RecipeDetailsProps) {
  if (!recipe) return null

  return (
    <section className="steps-section" id="recipe">
      <div className="section-heading compact">
        <div><p className="eyebrow">Рецепт</p><h2>{recipe.title}</h2></div>
        <div className="recipe-detail-meta">
          <span className="time-label">≈ {recipe.totalMinutes} минут</span>
          {recipe.videoUrl && (
            <a href={recipe.videoUrl} target="_blank" rel="noreferrer">Смотреть видео ↗</a>
          )}
        </div>
      </div>
      {recipe.description && <p className="recipe-description">{recipe.description}</p>}
      <ol className="steps-list">
        {recipe.steps.map((step, index) => (
          <li key={`${recipe.slug}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
