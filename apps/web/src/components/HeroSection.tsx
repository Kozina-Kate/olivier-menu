/** Статичный приветственный блок вынесен отдельно, чтобы не загружать App.tsx. */
export function HeroSection() {
  return (
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
  )
}
