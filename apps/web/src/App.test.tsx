import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPantryIngredients, loadRecipeMatches, loadRecipes } from './api'
import App from './App'
import { tomatoSoupRecipe } from './test/fixtures'

// Настоящий HTTP-запрос здесь не нужен: API уже проверяется Django-тестами.
// vi.mock заменяет модуль api управляемой тестовой версией, поэтому frontend-
// тест остаётся быстрым и не зависит от запущенного backend-сервера.
vi.mock('./api', () => ({
  loadRecipes: vi.fn(),
  loadPantryIngredients: vi.fn(),
  loadRecipeMatches: vi.fn(),
}))

const mockedLoadRecipes = vi.mocked(loadRecipes)
const mockedLoadPantryIngredients = vi.mocked(loadPantryIngredients)
const mockedLoadRecipeMatches = vi.mocked(loadRecipeMatches)
const products = [
  { id: 1, slug: 'potato', name: 'Картофель', section: 'vegetables', section_label: 'Овощи' },
  { id: 2, slug: 'tomato', name: 'Томаты', section: 'vegetables', section_label: 'Овощи' },
  { id: 3, slug: 'eggs', name: 'Яйца', section: 'dairy', section_label: 'Молочные продукты и яйца' },
]

function renderApp(route = '/menu') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.clearAllMocks()
    // Возвращаем пустой ответ: useRecipes сохранит встроенный рецепт Оливье.
    mockedLoadRecipes.mockResolvedValue([])
    mockedLoadPantryIngredients.mockResolvedValue(products)
    mockedLoadRecipeMatches.mockResolvedValue([])
  })

  it('фильтрует каталог по введённому запросу', async () => {
    const user = userEvent.setup()
    renderApp()

    // screen ищет элементы так же, как их воспринимает пользователь. Запрос по
    // placeholder устойчивее, чем привязка теста к CSS-классам или структуре DOM.
    const search = screen.getByPlaceholderText('Название или ингредиент')
    await user.type(search, 'борщ')

    expect(
      screen.getByText('Ничего не найдено. Попробуйте изменить поиск или фильтр.'),
    ).toBeInTheDocument()

    await user.clear(search)
    expect(screen.getByRole('heading', { name: 'Классический Оливье', level: 3 })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Показан демонстрационный рецепт Оливье')
  })

  it('удаляет блюдо, блокирует экспорт и добавляет блюдо обратно', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: '✓ В меню' }))

    expect(screen.getByRole('heading', { name: 'Меню пока пустое' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копировать' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '+ Добавить в меню' }))

    expect(screen.getByRole('button', { name: 'Копировать' })).toBeEnabled()
    expect(screen.getByText('В меню: Классический Оливье.')).toBeInTheDocument()
  })

  it('показывает пересчитанное количество продуктов для пяти гостей', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Увеличить' }))

    // within ограничивает поиск одной строкой списка. Это защищает тест от
    // совпадений со словом «Картофель» в других секциях страницы.
    const potatoRow = screen.getByRole('checkbox', { name: 'Картофель' }).closest('li')
    expect(potatoRow).not.toBeNull()
    expect(within(potatoRow!).getByText('500 г')).toBeInTheDocument()
    expect(screen.getByText('на 5 чел.')).toBeInTheDocument()
  })

  it('показывает на главной только выбор из двух сценариев', () => {
    renderApp('/')

    expect(screen.queryByPlaceholderText('Название или ингредиент')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Составить меню и список покупок/ }))
      .toHaveAttribute('href', '/menu')
    expect(screen.getByRole('link', { name: /Приготовить из продуктов дома/ }))
      .toHaveAttribute('href', '/pantry')
  })

  it('переходит с главной в работающий конструктор меню', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(screen.getByRole('link', { name: /Составить меню и список покупок/ }))

    expect(screen.getByPlaceholderText('Название или ингредиент')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Что приготовим?' })).toBeInTheDocument()
  })

  it('открывает каталог продуктов с секциями и пустым выбором', async () => {
    renderApp('/pantry')

    expect(screen.getByRole('heading', { name: 'Что есть на вашей кухне?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← К выбору сценария' })).toHaveAttribute('href', '/')
    expect(await screen.findByRole('heading', { name: 'Молочные продукты и яйца' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Картофель' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Найти рецепты →' })).toBeDisabled()
  })

  it('сохраняет выбор при поиске и передаёт ID в подбор', async () => {
    const user = userEvent.setup()
    renderApp('/pantry')
    const potato = await screen.findByRole('button', { name: 'Картофель' })
    await user.click(potato)
    const search = screen.getByRole('searchbox', { name: 'Поиск продуктов' })
    await user.type(search, 'том')
    expect(screen.queryByRole('button', { name: 'Картофель' })).not.toBeInTheDocument()
    expect(screen.getByText('Выбрано:', { exact: false })).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    await waitFor(() => expect(mockedLoadRecipeMatches).toHaveBeenCalledWith([1]))
    await user.clear(search)
    expect(screen.getByRole('button', { name: 'Картофель' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(window.sessionStorage.getItem('olivier-pantry-v1')!)).toEqual({
      selected: [1], submitted: [1],
    })
  })

  it('разделяет полные и частичные совпадения и сохраняет выбор после рецепта', async () => {
    const user = userEvent.setup()
    mockedLoadRecipeMatches.mockResolvedValue([
      {
        recipe: { ...tomatoSoupRecipe, slug: 'tomato-salad', title: 'Томатный салат' },
        canCook: false, matchPercent: 50, matchedIngredients: [],
        missingIngredients: [{ id: 3, slug: 'eggs', name: 'Яйца', is_required: true }],
      },
      {
        recipe: tomatoSoupRecipe, canCook: true, matchPercent: 100,
        matchedIngredients: [], missingIngredients: [],
      },
    ])
    renderApp('/pantry')
    await user.click(await screen.findByRole('button', { name: 'Томаты' }))
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    const ready = await screen.findByRole('region', { name: 'Можно приготовить' })
    const close = screen.getByRole('region', { name: 'Почти подходит' })
    expect(screen.getByRole('heading', { name: 'Что приготовить?' })).toHaveFocus()
    expect(within(ready).getByText('100% совпадения')).toBeInTheDocument()
    expect(within(close).getByText('Не хватает: Яйца')).toBeInTheDocument()
    await user.click(within(ready).getByRole('link', { name: 'Открыть рецепт →' }))
    expect(screen.getByRole('heading', { name: 'Томатный суп' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '← К подбору рецептов' }))
    expect(await screen.findByRole('button', { name: 'Томаты' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('region', { name: 'Можно приготовить' })).toBeInTheDocument()
  })

  it('проходит путь с главной через подбор к рецепту и обратно', async () => {
    const user = userEvent.setup()
    mockedLoadRecipeMatches.mockResolvedValue([{
      recipe: tomatoSoupRecipe,
      canCook: true,
      matchPercent: 100,
      matchedIngredients: [{ id: 2, slug: 'tomato', name: 'Томаты', is_required: true }],
      missingIngredients: [],
    }])
    renderApp('/')

    await user.click(screen.getByRole('link', { name: /Приготовить из продуктов дома/ }))
    await user.click(await screen.findByRole('button', { name: 'Томаты' }))
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    const results = await screen.findByRole('region', { name: 'Можно приготовить' })
    await user.click(within(results).getByRole('link', { name: 'Открыть рецепт →' }))

    expect(screen.getByRole('heading', { name: 'Томатный суп' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '← К подбору рецептов' }))
    expect(await screen.findByRole('button', { name: 'Томаты' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('region', { name: 'Можно приготовить' })).toBeInTheDocument()
  })

  it('показывает пустую выдачу с возможностью изменить продукты', async () => {
    const user = userEvent.setup()
    renderApp('/pantry')
    await user.click(await screen.findByRole('button', { name: 'Картофель' }))
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    expect(await screen.findByRole('heading', { name: 'Пока ничего не подошло' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Изменить продукты' })[0])
    expect(screen.queryByRole('heading', { name: 'Пока ничего не подошло' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Картофель' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('показывает ошибку каталога и повторяет загрузку', async () => {
    const user = userEvent.setup()
    mockedLoadPantryIngredients.mockRejectedValueOnce(new Error('offline'))
    renderApp('/pantry')
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить продукты')
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByRole('button', { name: 'Картофель' })).toBeInTheDocument()
  })

  it('показывает ошибку подбора и повторяет запрос без потери выбора', async () => {
    const user = userEvent.setup()
    mockedLoadRecipeMatches.mockRejectedValueOnce(new Error('offline'))
    renderApp('/pantry')
    await user.click(await screen.findByRole('button', { name: 'Картофель' }))
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось подобрать рецепты')
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByRole('heading', { name: 'Пока ничего не подошло' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Картофель' })).toHaveAttribute('aria-pressed', 'true')
    expect(mockedLoadRecipeMatches).toHaveBeenCalledTimes(2)
  })

  it('восстанавливает выбор и результат после повторного открытия страницы во вкладке', async () => {
    const user = userEvent.setup()
    const first = renderApp('/pantry')
    await user.click(await screen.findByRole('button', { name: 'Картофель' }))
    await user.click(screen.getByRole('button', { name: 'Найти рецепты →' }))
    await screen.findByRole('heading', { name: 'Пока ничего не подошло' })
    first.unmount()

    renderApp('/pantry')
    expect(await screen.findByRole('button', { name: 'Картофель' })).toHaveAttribute('aria-pressed', 'true')
    await screen.findByRole('heading', { name: 'Пока ничего не подошло' })
    expect(mockedLoadRecipeMatches).toHaveBeenLastCalledWith([1])
  })

  it('позволяет выбрать и снять продукт клавиатурой', async () => {
    const user = userEvent.setup()
    renderApp('/pantry')
    const potato = await screen.findByRole('button', { name: 'Картофель' })
    potato.focus()
    await user.keyboard('{Enter}')
    expect(potato).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard(' ')
    expect(potato).toHaveAttribute('aria-pressed', 'false')
  })

  it('показывает пустой каталог без возможности подбора', async () => {
    mockedLoadPantryIngredients.mockResolvedValue([])
    renderApp('/pantry')
    expect(await screen.findByRole('heading', { name: 'Продуктов пока нет' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Найти рецепты →' })).not.toBeInTheDocument()
  })

  it('открывает рецепт по прямому URL', () => {
    renderApp('/recipes/olivier')

    expect(screen.getByRole('heading', { name: 'Классический Оливье' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← К каталогу' })).toHaveAttribute(
      'href',
      '/menu#recipes',
    )
  })
})
