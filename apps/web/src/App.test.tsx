import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRecipes } from './api'
import App from './App'

// Настоящий HTTP-запрос здесь не нужен: API уже проверяется Django-тестами.
// vi.mock заменяет модуль api управляемой тестовой версией, поэтому frontend-
// тест остаётся быстрым и не зависит от запущенного backend-сервера.
vi.mock('./api', () => ({ loadRecipes: vi.fn() }))

const mockedLoadRecipes = vi.mocked(loadRecipes)

describe('App', () => {
  beforeEach(() => {
    // Возвращаем пустой ответ: useRecipes сохранит встроенный рецепт Оливье.
    mockedLoadRecipes.mockResolvedValue([])
  })

  it('фильтрует каталог по введённому запросу', async () => {
    const user = userEvent.setup()
    render(<App />)

    // screen ищет элементы так же, как их воспринимает пользователь. Запрос по
    // placeholder устойчивее, чем привязка теста к CSS-классам или структуре DOM.
    const search = screen.getByPlaceholderText('Название или ингредиент')
    await user.type(search, 'борщ')

    expect(
      screen.getByText('Ничего не найдено. Попробуйте изменить поиск или фильтр.'),
    ).toBeInTheDocument()

    await user.clear(search)
    expect(screen.getByRole('heading', { name: 'Классический Оливье', level: 3 })).toBeInTheDocument()
  })

  it('удаляет блюдо, блокирует экспорт и добавляет блюдо обратно', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '✓ В меню' }))

    expect(screen.getByRole('heading', { name: 'Меню пока пустое' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копировать' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '+ Добавить в меню' }))

    expect(screen.getByRole('button', { name: 'Копировать' })).toBeEnabled()
    expect(screen.getByText('В меню: Классический Оливье.')).toBeInTheDocument()
  })

  it('показывает пересчитанное количество продуктов для пяти гостей', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Увеличить' }))

    // within ограничивает поиск одной строкой списка. Это защищает тест от
    // совпадений со словом «Картофель» в других секциях страницы.
    const potatoRow = screen.getByRole('checkbox', { name: 'Картофель' }).closest('li')
    expect(potatoRow).not.toBeNull()
    expect(within(potatoRow!).getByText('500 г')).toBeInTheDocument()
    expect(screen.getByText('на 5 чел.')).toBeInTheDocument()
  })
})
