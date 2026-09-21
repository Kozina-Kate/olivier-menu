import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useShoppingListActions } from './useShoppingListActions'

describe('useShoppingListActions', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>()

  beforeEach(() => {
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    writeText.mockReset()
  })

  it('копирует рассчитанный список и сообщает об успехе', async () => {
    const { result } = renderHook(() => useShoppingListActions({
      guests: 4,
      hasMenu: true,
      shoppingText: 'Картофель — 400 г',
    }))

    await act(async () => result.current.copyList())

    expect(writeText).toHaveBeenCalledWith('Картофель — 400 г')
    expect(result.current.notice).toBe('Список скопирован')
  })

  it('скачивает актуальный список в txt-файл', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const createObjectURL = vi.fn(() => 'blob:shopping-list')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const { result } = renderHook(() => useShoppingListActions({
      guests: 6,
      hasMenu: true,
      shoppingText: 'Яйца — 6 шт.',
    }))

    act(() => result.current.downloadList())

    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(anchor.download).toBe('spisok-produktov-6.txt')
    expect(anchor.href).toBe('blob:shopping-list')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shopping-list')
    expect(result.current.notice).toBe('Файл сохранён')
  })

  it('не запускает экспорт для пустого меню', async () => {
    const { result } = renderHook(() => useShoppingListActions({
      guests: 4,
      hasMenu: false,
      shoppingText: '',
    }))

    await act(async () => result.current.copyList())

    expect(writeText).not.toHaveBeenCalled()
    expect(result.current.notice).toBe('')
  })
})
