import { useEffect, useMemo, useState } from 'react'
import {
  buildMenuShoppingListText,
  combineRecipeIngredients,
  formatIngredientAmount,
  type Recipe,
} from '@olivier/core'
import { olivierRecipe } from './olivier'
import { loadRecipes } from './api'
import './App.css'

const difficultyLabels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }
type Filter = 'all' | 'quick' | 'easy' | `category:${string}`

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([olivierRecipe])
  const [guests, setGuests] = useState(4)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    new Set(['olivier']),
  )
  const [activeRecipeSlug, setActiveRecipeSlug] = useState('olivier')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    loadRecipes()
      .then((loadedRecipes) => {
        if (!loadedRecipes.length) return
        setRecipes(loadedRecipes)
        setActiveRecipeSlug((current) =>
          loadedRecipes.some((recipe) => recipe.slug === current)
            ? current
            : loadedRecipes[0].slug,
        )
        setSelectedSlugs((current) => {
          const available = new Set(loadedRecipes.map((recipe) => recipe.slug))
          const preserved = new Set([...current].filter((slug) => available.has(slug)))
          return preserved.size ? preserved : new Set([loadedRecipes[0].slug])
        })
      })
      .catch(() => {
        // Статический Оливье оставляет интерфейс рабочим, пока локальный API выключен.
      })
  }, [])

  const categories = useMemo(() => {
    const unique = new Map<string, string>()
    recipes.forEach((recipe) => unique.set(recipe.category.slug, recipe.category.name))
    return [...unique.entries()].map(([slug, name]) => ({ slug, name }))
  }, [recipes])

  const visibleRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru')

    return recipes.filter((recipe) => {
      const searchable = [
        recipe.title,
        recipe.summary,
        recipe.category.name,
        ...recipe.ingredients.map((ingredient) => ingredient.name),
      ]
        .join(' ')
        .toLocaleLowerCase('ru')
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'quick' && recipe.totalMinutes <= 60) ||
        (filter === 'easy' && recipe.difficulty === 'easy') ||
        (filter.startsWith('category:') && recipe.category.slug === filter.slice(9))

      return matchesQuery && matchesFilter
    })
  }, [filter, query, recipes])

  const menuRecipes = useMemo(
    () => recipes.filter((recipe) => selectedSlugs.has(recipe.slug)),
    [recipes, selectedSlugs],
  )
  const shoppingIngredients = useMemo(
    () => combineRecipeIngredients(menuRecipes, guests),
    [guests, menuRecipes],
  )
  const activeRecipe =
    recipes.find((recipe) => recipe.slug === activeRecipeSlug) ?? recipes[0]
  const shoppingText = buildMenuShoppingListText(menuRecipes, guests)
  const hasMenu = menuRecipes.length > 0

  const changeGuests = (next: number) => {
    setGuests(Math.min(50, Math.max(1, next)))
    setChecked(new Set())
  }

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const toggleMenu = (recipe: Recipe) => {
    setSelectedSlugs((current) => {
      const next = new Set(current)
      if (next.has(recipe.slug)) next.delete(recipe.slug)
      else next.add(recipe.slug)
      return next
    })
    setActiveRecipeSlug(recipe.slug)
    setChecked(new Set())
  }

  const copyList = async () => {
    if (!hasMenu) return
    await navigator.clipboard.writeText(shoppingText)
    flash('Список скопирован')
  }

  const shareList = async () => {
    if (!hasMenu) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Список продуктов', text: shoppingText })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        throw error
      }
      return
    }
    await copyList()
  }

  const downloadList = () => {
    if (!hasMenu) return
    const blob = new Blob([shoppingText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `spisok-produktov-${guests}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    flash('Файл сохранён')
  }

  const toggleChecked = (id: string) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Оливье — на главную">
          <span className="brand-mark">О</span><span>оливье</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#recipes">Рецепты</a>
          <a href="#menu">Моё меню · {menuRecipes.length}</a>
        </nav>
        <span className="mvp-badge">MVP 02</span>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Домашний праздник без лишних покупок</p>
            <h1>Меню соберётся.<br />Продукты посчитаются.</h1>
            <p className="hero-text">
              Выберите блюда и количество гостей — мы подготовим точный список,
              который удобно взять с собой в магазин.
            </p>
            <a className="primary-button" href="#recipes">Собрать меню <span>→</span></a>
          </div>
          <div className="salad-visual" aria-label="Иллюстрация салата Оливье">
            <div className="plate">
              <span className="cube cube-1" /><span className="cube cube-2" />
              <span className="cube cube-3" /><span className="cube cube-4" />
              <span className="pea pea-1" /><span className="pea pea-2" />
              <span className="pea pea-3" /><span className="carrot carrot-1" />
              <span className="carrot carrot-2" /><span className="dill">✦</span>
            </div>
            <span className="visual-note">первый рецепт</span>
          </div>
        </section>

        <section className="catalog-section" id="recipes">
          <div className="section-heading">
            <div><p className="eyebrow">Каталог</p><h2>Что приготовим?</h2></div>
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название или ингредиент"
              />
            </label>
          </div>
          <div className="filter-row" aria-label="Фильтры рецептов">
            <button className={filter === 'all' ? 'filter active' : 'filter'} type="button" onClick={() => setFilter('all')}>Все блюда</button>
            {categories.map((category) => (
              <button
                className={filter === `category:${category.slug}` ? 'filter active' : 'filter'}
                key={category.slug}
                type="button"
                onClick={() => setFilter(`category:${category.slug}`)}
              >
                {category.name}
              </button>
            ))}
            <button className={filter === 'quick' ? 'filter active' : 'filter'} type="button" onClick={() => setFilter('quick')}>До 60 минут</button>
            <button className={filter === 'easy' ? 'filter active' : 'filter'} type="button" onClick={() => setFilter('easy')}>Легко</button>
          </div>

          {visibleRecipes.length ? (
            <div className="recipe-grid">
              {visibleRecipes.map((recipe) => {
                const isSelected = selectedSlugs.has(recipe.slug)
                return (
                  <article className="recipe-card" key={recipe.slug}>
                    <div className="recipe-picture">
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt={recipe.title} />
                      ) : (
                        <div className="mini-bowl">{recipe.title.slice(0, 1)}</div>
                      )}
                      <span>{recipe.category.name}</span>
                    </div>
                    <div className="recipe-info">
                      <div className="recipe-meta">
                        <span>{recipe.totalMinutes} минут</span>
                        <span>{difficultyLabels[recipe.difficulty]}</span>
                        {recipe.isVegetarian && <span>Без мяса</span>}
                      </div>
                      <h3>{recipe.title}</h3><p>{recipe.summary}</p>
                      <div className="recipe-actions">
                        <button
                          className={isSelected ? 'menu-button selected' : 'menu-button'}
                          type="button"
                          onClick={() => toggleMenu(recipe)}
                        >
                          {isSelected ? '✓ В меню' : '+ Добавить в меню'}
                        </button>
                        <a href="#recipe" onClick={() => setActiveRecipeSlug(recipe.slug)}>Открыть рецепт →</a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : <p className="empty-state">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>}
        </section>

        <section className="planner-section" id="menu">
          <div className="planner-intro">
            <p className="eyebrow">Расчёт продуктов</p><h2>Сколько будет гостей?</h2>
            <p>Все выбранные блюда пересчитаются на одно количество персон.</p>
            <div className="guest-counter" aria-label="Количество гостей">
              <button type="button" onClick={() => changeGuests(guests - 1)} aria-label="Уменьшить">−</button>
              <div><strong>{guests}</strong><span>человек</span></div>
              <button type="button" onClick={() => changeGuests(guests + 1)} aria-label="Увеличить">+</button>
            </div>
            <p className="portion-hint">
              В меню: {menuRecipes.length ? menuRecipes.map((recipe) => recipe.title).join(', ') : 'пока ничего'}.
            </p>
          </div>

          <div className="shopping-card">
            <div className="shopping-header">
              <div><p className="eyebrow">Список покупок</p><h3>{hasMenu ? `${shoppingIngredients.length} продуктов` : 'Меню пока пустое'}</h3></div>
              <span className="guest-pill">на {guests} чел.</span>
            </div>
            {hasMenu && <ul className="shopping-list">
              {shoppingIngredients.map((ingredient) => (
                <li key={ingredient.id} className={checked.has(ingredient.id) ? 'checked' : ''}>
                  <label>
                    <input type="checkbox" checked={checked.has(ingredient.id)} onChange={() => toggleChecked(ingredient.id)} />
                    <span className="checkmark" aria-hidden="true" /><span className="ingredient-name">{ingredient.name}</span>
                  </label>
                  <strong>{formatIngredientAmount(ingredient)}</strong>
                </li>
              ))}
            </ul>}
            <div className="shopping-actions">
              <button type="button" onClick={shareList} disabled={!hasMenu}>Поделиться</button>
              <button type="button" onClick={copyList} disabled={!hasMenu}>Копировать</button>
              <button type="button" onClick={downloadList} disabled={!hasMenu}>Скачать .txt</button>
            </div>
          </div>
        </section>

        {activeRecipe && (
          <section className="steps-section" id="recipe">
            <div className="section-heading compact">
              <div><p className="eyebrow">Рецепт</p><h2>{activeRecipe.title}</h2></div>
              <div className="recipe-detail-meta">
                <span className="time-label">≈ {activeRecipe.totalMinutes} минут</span>
                {activeRecipe.videoUrl && <a href={activeRecipe.videoUrl} target="_blank" rel="noreferrer">Смотреть видео ↗</a>}
              </div>
            </div>
            {activeRecipe.description && <p className="recipe-description">{activeRecipe.description}</p>}
            <ol className="steps-list">
              {activeRecipe.steps.map((step, index) => <li key={`${activeRecipe.slug}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}
            </ol>
          </section>
        )}
      </main>

      <footer>
        <div className="brand"><span className="brand-mark">О</span><span>оливье</span></div>
        <p>Планируем вкусное. Покупаем ровно столько, сколько нужно.</p>
      </footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
