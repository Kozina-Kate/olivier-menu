import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PantryIngredient, RecipeMatch } from '../api'
import { RecipeCard } from '../components/RecipeCatalog'
import { usePantry } from '../hooks/usePantry'

function groupIngredients(items: PantryIngredient[]) {
  const groups = new Map<string, { label: string; items: PantryIngredient[] }>()
  for (const item of items) {
    if (!groups.has(item.section)) groups.set(item.section, { label: item.section_label, items: [] })
    groups.get(item.section)!.items.push(item)
  }
  return [...groups.entries()]
}

function MatchGroup({ title, matches, onEdit }: {
  title: string
  matches: RecipeMatch[]
  onEdit: () => void
}) {
  if (!matches.length) return null
  return (
    <section className="match-group" aria-label={title}>
      <div className="section-heading compact">
        <h2>{title}</h2><span className="match-count">{matches.length}</span>
      </div>
      <div className="recipe-grid">
        {matches.map((match) => (
          <RecipeCard
            key={match.recipe.slug}
            recipe={match.recipe}
            match={match}
            onEditProducts={onEdit}
          />
        ))}
      </div>
    </section>
  )
}

export function PantryPage() {
  const [query, setQuery] = useState('')
  const pantry = usePantry()
  const filtered = pantry.ingredients?.filter((item) =>
    item.name.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')),
  ) ?? []
  const ready = pantry.matches?.filter((match) => match.canCook) ?? []
  const close = pantry.matches?.filter((match) => !match.canCook) ?? []

  return (
    <section className="standalone-page pantry-page" aria-labelledby="pantry-title">
      <Link className="back-link" to="/">← К выбору сценария</Link>
      <div className="pantry-copy">
        <p className="eyebrow">Продукты дома</p>
        <h1 id="pantry-title">Что есть на вашей кухне?</h1>
        <p>Отметьте продукты — покажем, что можно приготовить сейчас и чего не хватает для других блюд.</p>
      </div>

      {pantry.ingredientsError ? (
        <div className="pantry-state" role="alert">
          <h2>Не удалось загрузить продукты</h2>
          <p>Проверьте соединение с сервером и попробуйте ещё раз.</p>
          <button className="secondary-button" type="button" onClick={pantry.retryIngredients}>Повторить</button>
        </div>
      ) : pantry.ingredients === null ? (
        <p className="pantry-state" role="status">Загружаем продукты…</p>
      ) : pantry.ingredients.length === 0 ? (
        <div className="pantry-state">
          <h2>Продуктов пока нет</h2>
          <p>Каталог появится, когда будут опубликованы рецепты с ингредиентами.</p>
        </div>
      ) : (
        <>
          <div className="pantry-toolbar">
            <label className="search-field pantry-search">
              <span className="visually-hidden">Поиск продуктов</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти продукт"
              />
            </label>
            <div className="pantry-selection" role="status">
              Выбрано: <strong>{pantry.selectedIds.size}</strong>
            </div>
            <button
              className="text-button"
              type="button"
              disabled={pantry.selectedIds.size === 0}
              onClick={pantry.clear}
            >Очистить</button>
          </div>

          {filtered.length ? (
            <div className="pantry-groups">
              {groupIngredients(filtered).map(([section, group]) => (
                <section className="pantry-group" key={section} aria-labelledby={`section-${section}`}>
                  <h2 id={`section-${section}`}>{group.label}</h2>
                  <div className="pantry-products">
                    {group.items.map((item) => (
                      <button
                        type="button"
                        className={pantry.selectedIds.has(item.id) ? 'product-chip selected' : 'product-chip'}
                        aria-pressed={pantry.selectedIds.has(item.id)}
                        key={item.id}
                        onClick={() => pantry.toggle(item.id)}
                      >
                        <span aria-hidden="true">{pantry.selectedIds.has(item.id) ? '✓' : '+'}</span>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-state">По запросу продуктов нет. Измените поиск — выбранное сохранится.</p>
          )}

          <div className="pantry-submit">
            <p>Можно выбрать продукты из разных разделов.</p>
            <button
              className="primary-button"
              type="button"
              disabled={pantry.selectedIds.size === 0}
              onClick={pantry.submit}
            >Найти рецепты →</button>
          </div>

          {pantry.submittedIds && (
            <div className="pantry-results" id="pantry-results" aria-live="polite">
              <div className="pantry-results-heading">
                <div><p className="eyebrow">Подбор</p><h2>Что приготовить?</h2></div>
                <button className="secondary-button" type="button" onClick={pantry.edit}>Изменить продукты</button>
              </div>
              {pantry.matchesError ? (
                <div className="pantry-state" role="alert">
                  <h3>Не удалось подобрать рецепты</h3>
                  <p>Выбранные продукты сохранены. Попробуйте отправить запрос ещё раз.</p>
                  <button className="secondary-button" type="button" onClick={pantry.retryMatches}>Повторить</button>
                </div>
              ) : pantry.matches === null ? (
                <p className="pantry-state" role="status">Подбираем рецепты…</p>
              ) : pantry.matches.length === 0 ? (
                <div className="pantry-state">
                  <h3>Пока ничего не подошло</h3>
                  <p>Попробуйте отметить ещё продукты или изменить набор.</p>
                  <button className="secondary-button" type="button" onClick={pantry.edit}>Изменить продукты</button>
                </div>
              ) : (
                <>
                  <MatchGroup title="Можно приготовить" matches={ready} onEdit={pantry.edit} />
                  <MatchGroup title="Почти подходит" matches={close} onEdit={pantry.edit} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
