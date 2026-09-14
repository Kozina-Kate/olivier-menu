import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="route-state" aria-labelledby="page-not-found">
      <p className="eyebrow">Страница не найдена</p>
      <h1 id="page-not-found">Вернёмся к выбору?</h1>
      <Link className="secondary-button" to="/">На главную</Link>
    </section>
  )
}
