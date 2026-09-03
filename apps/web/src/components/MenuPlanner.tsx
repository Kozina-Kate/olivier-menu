import { formatIngredientAmount, type Recipe, type ScaledIngredient } from '@olivier/core'

type MenuPlannerProps = {
  checked: Set<string>
  guests: number
  hasMenu: boolean
  ingredients: ScaledIngredient[]
  menuRecipes: Recipe[]
  onChangeGuests: (guests: number) => void
  onCopy: () => void
  onDownload: () => void
  onShare: () => void
  onToggleChecked: (id: string) => void
}

/** Секция планирования получает уже рассчитанные ингредиенты и только отображает их. */
export function MenuPlanner({
  checked,
  guests,
  hasMenu,
  ingredients,
  menuRecipes,
  onChangeGuests,
  onCopy,
  onDownload,
  onShare,
  onToggleChecked,
}: MenuPlannerProps) {
  return (
    <section className="planner-section" id="menu">
      <div className="planner-intro">
        <p className="eyebrow">Расчёт продуктов</p>
        <h2>Сколько будет гостей?</h2>
        <p>Все выбранные блюда пересчитаются на одно количество персон.</p>
        <div className="guest-counter" aria-label="Количество гостей">
          <button type="button" onClick={() => onChangeGuests(guests - 1)} aria-label="Уменьшить">−</button>
          <div><strong>{guests}</strong><span>человек</span></div>
          <button type="button" onClick={() => onChangeGuests(guests + 1)} aria-label="Увеличить">+</button>
        </div>
        <p className="portion-hint">
          В меню: {menuRecipes.length ? menuRecipes.map((recipe) => recipe.title).join(', ') : 'пока ничего'}.
        </p>
      </div>

      <div className="shopping-card">
        <div className="shopping-header">
          <div>
            <p className="eyebrow">Список покупок</p>
            <h3>{hasMenu ? `${ingredients.length} продуктов` : 'Меню пока пустое'}</h3>
          </div>
          <span className="guest-pill">на {guests} чел.</span>
        </div>

        {hasMenu && (
          <ul className="shopping-list">
            {ingredients.map((ingredient) => (
              <li key={ingredient.id} className={checked.has(ingredient.id) ? 'checked' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked.has(ingredient.id)}
                    onChange={() => onToggleChecked(ingredient.id)}
                  />
                  <span className="checkmark" aria-hidden="true" />
                  <span className="ingredient-name">{ingredient.name}</span>
                </label>
                <strong>{formatIngredientAmount(ingredient)}</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="shopping-actions">
          <button type="button" onClick={onShare} disabled={!hasMenu}>Поделиться</button>
          <button type="button" onClick={onCopy} disabled={!hasMenu}>Копировать</button>
          <button type="button" onClick={onDownload} disabled={!hasMenu}>Скачать .txt</button>
        </div>
      </div>
    </section>
  )
}
