import { Link } from 'react-router-dom'

export function PantryPage() {
  return (
    <section className="standalone-page pantry-page" aria-labelledby="pantry-title">
      <Link className="back-link" to="/">← К выбору сценария</Link>
      <div className="pantry-copy">
        <p className="eyebrow">Продукты дома</p>
        <h1 id="pantry-title">Что есть на вашей кухне?</h1>
        <p>
          Здесь появится каталог продуктов: отметите запасы и получите рецепты,
          которые можно приготовить полностью или почти полностью.
        </p>
        <Link className="secondary-button" to="/menu">Пока составить меню</Link>
      </div>
      <div className="pantry-note" aria-label="Следующий шаг">
        <span>Следующий шаг</span>
        <strong>Выбор продуктов по категориям</strong>
      </div>
    </section>
  )
}
