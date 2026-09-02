import { useEffect, useMemo, useState } from 'react'
import {
  buildShoppingListText,
  formatIngredientAmount,
  scaleRecipeIngredients,
} from '@olivier/core'
import { olivierRecipe } from './olivier'
import { loadRecipe } from './api'
import './App.css'

const difficultyLabels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

function App() {
  const [recipe, setRecipe] = useState(olivierRecipe)
  const [guests, setGuests] = useState(4)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')

  const scaledIngredients = useMemo(
    () => scaleRecipeIngredients(recipe, guests),
    [guests, recipe],
  )
  const recipeMatches = recipe.title.toLowerCase().includes(query.toLowerCase())
  const shoppingText = buildShoppingListText(recipe, guests)

  useEffect(() => {
    loadRecipe('olivier').then(setRecipe).catch(() => {
      // Статический рецепт оставляет интерфейс рабочим, пока локальный API выключен.
    })
  }, [])

  const changeGuests = (next: number) => {
    setGuests(Math.min(50, Math.max(1, next)))
    setChecked(new Set())
  }

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const copyList = async () => {
    await navigator.clipboard.writeText(shoppingText)
    flash('Список скопирован')
  }

  const shareList = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Список продуктов', text: shoppingText })
      return
    }
    await copyList()
  }

  const downloadList = () => {
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
          <a href="#recipes">Рецепты</a><a href="#menu">Моё меню</a>
        </nav>
        <span className="mvp-badge">MVP 01</span>
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
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти рецепт" />
            </label>
          </div>
          <div className="filter-row" aria-label="Фильтры рецептов">
            <button className="filter active" type="button">Все блюда</button>
            <button className="filter" type="button">Салаты</button>
            <button className="filter" type="button">До 60 минут</button>
            <button className="filter" type="button">Легко</button>
          </div>

          {recipeMatches ? (
            <article className="recipe-card">
              <div className="recipe-picture"><div className="mini-bowl">О</div><span>праздничная классика</span></div>
              <div className="recipe-info">
                <div className="recipe-meta"><span>{recipe.totalMinutes} минут</span><span>{difficultyLabels[recipe.difficulty]}</span></div>
                <h3>{recipe.title}</h3><p>{recipe.summary}</p>
                <button className={selected ? 'menu-button selected' : 'menu-button'} type="button" onClick={() => setSelected((value) => !value)}>
                  {selected ? '✓ В меню' : '+ Добавить в меню'}
                </button>
              </div>
            </article>
          ) : <p className="empty-state">Пока такого рецепта нет. Попробуйте поискать «Оливье».</p>}
        </section>

        <section className="planner-section" id="menu">
          <div className="planner-intro">
            <p className="eyebrow">Расчёт продуктов</p><h2>Сколько будет гостей?</h2>
            <p>Мы пересчитаем базовый рецепт на выбранное количество персон.</p>
            <div className="guest-counter" aria-label="Количество гостей">
              <button type="button" onClick={() => changeGuests(guests - 1)} aria-label="Уменьшить">−</button>
              <div><strong>{guests}</strong><span>человек</span></div>
              <button type="button" onClick={() => changeGuests(guests + 1)} aria-label="Увеличить">+</button>
            </div>
            <p className="portion-hint">Можно изменить позже для каждого блюда отдельно.</p>
          </div>

          <div className="shopping-card">
            <div className="shopping-header">
              <div><p className="eyebrow">Список покупок</p><h3>{selected ? `${scaledIngredients.length} продуктов` : 'Меню пока пустое'}</h3></div>
              <span className="guest-pill">на {guests} чел.</span>
            </div>
            {selected && <ul className="shopping-list">
              {scaledIngredients.map((ingredient) => (
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
              <button type="button" onClick={shareList} disabled={!selected}>Поделиться</button>
              <button type="button" onClick={copyList} disabled={!selected}>Копировать</button>
              <button type="button" onClick={downloadList} disabled={!selected}>Скачать .txt</button>
            </div>
          </div>
        </section>

        <section className="steps-section">
          <div className="section-heading compact">
            <div><p className="eyebrow">Рецепт</p><h2>Готовим Оливье</h2></div>
            <span className="time-label">≈ {recipe.totalMinutes} минут</span>
          </div>
          <ol className="steps-list">
            {recipe.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}
          </ol>
        </section>
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
