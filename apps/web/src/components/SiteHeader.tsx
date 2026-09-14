import { Link, NavLink } from 'react-router-dom'

type SiteHeaderProps = { menuCount: number }

/** Верхняя навигация не хранит состояние: получает готовое число через props. */
export function SiteHeader({ menuCount }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Оливье — на главную">
        <span className="brand-mark">О</span><span>оливье</span>
      </Link>
      <nav aria-label="Основная навигация">
        <NavLink to="/menu">Меню · {menuCount}</NavLink>
        <NavLink to="/pantry">Из продуктов дома</NavLink>
      </nav>
      <span className="mvp-badge">MVP 02</span>
    </header>
  )
}
