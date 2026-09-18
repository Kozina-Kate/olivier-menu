import type { Recipe } from '@olivier/core'
import { Link } from 'react-router-dom'
import type { RecipeMatch } from '../api'
import type { RecipeFilter } from '../hooks/useRecipeFilters'

const difficultyLabels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

type RecipeCatalogProps = {
  categories: Array<{ name: string; slug: string }>
  filter: RecipeFilter
  onFilterChange: (filter: RecipeFilter) => void
  onQueryChange: (query: string) => void
  onToggleMenu: (recipe: Recipe) => void
  query: string
  recipes: Recipe[]
  selectedSlugs: Set<string>
}

/** Каталог — презентационный компонент: данные и обработчики приходят через props. */
export function RecipeCatalog({
  categories,
  filter,
  onFilterChange,
  onQueryChange,
  onToggleMenu,
  query,
  recipes,
  selectedSlugs,
}: RecipeCatalogProps) {
  return (
    <section className="catalog-section" id="recipes">
      <div className="section-heading">
        <div><p className="eyebrow">Каталог</p><h2>Что приготовим?</h2></div>
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Название или ингредиент"
          />
        </label>
      </div>

      <div className="filter-row" aria-label="Фильтры рецептов">
        <FilterButton active={filter === 'all'} onClick={() => onFilterChange('all')}>
          Все блюда
        </FilterButton>
        {categories.map((category) => (
          <FilterButton
            active={filter === `category:${category.slug}`}
            key={category.slug}
            onClick={() => onFilterChange(`category:${category.slug}`)}
          >
            {category.name}
          </FilterButton>
        ))}
        <FilterButton active={filter === 'quick'} onClick={() => onFilterChange('quick')}>
          До 60 минут
        </FilterButton>
        <FilterButton active={filter === 'easy'} onClick={() => onFilterChange('easy')}>
          Легко
        </FilterButton>
      </div>

      {recipes.length ? (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              isSelected={selectedSlugs.has(recipe.slug)}
              key={recipe.slug}
              onToggle={() => onToggleMenu(recipe)}
              recipe={recipe}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>
      )}
    </section>
  )
}

type FilterButtonProps = {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}

function FilterButton({ active, children, onClick }: FilterButtonProps) {
  return (
    <button className={active ? 'filter active' : 'filter'} type="button" onClick={onClick}>
      {children}
    </button>
  )
}

type RecipeCardProps = {
  isSelected?: boolean
  onToggle?: () => void
  match?: RecipeMatch
  onEditProducts?: () => void
  recipe: Recipe
}

export function RecipeCard({ isSelected, onToggle, match, onEditProducts, recipe }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <div className="recipe-picture">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} />
        ) : (
          <div className="mini-bowl">{recipe.title.slice(0, 1)}</div>
        )}
        <span>{recipe.category.name}</span>
      </div>
      <div className="recipe-info">
        {match && (
          <div className="match-summary">
            <span className={match.canCook ? 'match-badge full' : 'match-badge'}>
              {match.canCook ? '✓ Можно приготовить' : 'Почти подходит'}
            </span>
            <strong>{match.matchPercent}% совпадения</strong>
          </div>
        )}
        <div className="recipe-meta">
          <span>{recipe.totalMinutes} минут</span>
          <span>{difficultyLabels[recipe.difficulty]}</span>
          {recipe.isVegetarian && <span>Без мяса</span>}
        </div>
        <h3>{recipe.title}</h3>
        <p>{recipe.summary}</p>
        {match && !match.canCook && (
          <p className="missing-products">
            Не хватает: {match.missingIngredients.map((item) => item.name).join(', ')}
          </p>
        )}
        <div className="recipe-actions">
          {onToggle && (
            <button
              className={isSelected ? 'menu-button selected' : 'menu-button'}
              type="button"
              onClick={onToggle}
            >
              {isSelected ? '✓ В меню' : '+ Добавить в меню'}
            </button>
          )}
          <Link
            to={`/recipes/${recipe.slug}`}
            state={match ? { pantryRecipe: recipe, fromPantry: true } : undefined}
          >Открыть рецепт →</Link>
          {onEditProducts && (
            <button className="text-button" type="button" onClick={onEditProducts}>
              Изменить продукты
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
