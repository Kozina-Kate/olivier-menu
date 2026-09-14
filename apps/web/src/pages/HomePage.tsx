import { Link } from 'react-router-dom'
import scenariosImage from '../assets/scenarios.jpg'

export function HomePage() {
  return (
    <section className="home-section" aria-labelledby="home-title">
      <div className="home-intro">
        <div>
          <p className="eyebrow">Домашнее меню без лишних хлопот</p>
          <h1 id="home-title">Что хотите приготовить?</h1>
          <p className="home-lead">
            Выберите задачу — собрать меню заранее или найти блюда из того,
            что уже есть дома.
          </p>
        </div>
        <img
          className="home-image"
          src={scenariosImage}
          alt="Салат Оливье и продукты для домашнего приготовления"
        />
      </div>

      <div className="scenario-grid" aria-label="Сценарии приготовления">
        <Link className="scenario-card menu-scenario" to="/menu">
          <span className="scenario-number" aria-hidden="true">01</span>
          <div>
            <p className="scenario-label">Планируем заранее</p>
            <h2>Составить меню и список покупок</h2>
            <p>Выберите блюда и количество гостей — продукты посчитаются автоматически.</p>
          </div>
          <span className="scenario-action">Собрать меню <span aria-hidden="true">→</span></span>
        </Link>

        <Link className="scenario-card pantry-scenario" to="/pantry">
          <span className="scenario-number" aria-hidden="true">02</span>
          <div>
            <p className="scenario-label">Готовим из запасов</p>
            <h2>Приготовить из продуктов дома</h2>
            <p>Отметьте продукты на кухне и узнайте, какие блюда уже доступны.</p>
          </div>
          <span className="scenario-action">Выбрать продукты <span aria-hidden="true">→</span></span>
        </Link>
      </div>
    </section>
  )
}
