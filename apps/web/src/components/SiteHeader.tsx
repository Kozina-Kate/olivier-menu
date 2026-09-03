type SiteHeaderProps = { menuCount: number }

/** Верхняя навигация не хранит состояние: получает готовое число через props. */
export function SiteHeader({ menuCount }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Оливье — на главную">
        <span className="brand-mark">О</span><span>оливье</span>
      </a>
      <nav aria-label="Основная навигация">
        <a href="#recipes">Рецепты</a>
        <a href="#menu">Моё меню · {menuCount}</a>
      </nav>
      <span className="mvp-badge">MVP 02</span>
    </header>
  )
}
