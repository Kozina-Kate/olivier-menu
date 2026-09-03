import { useCallback, useEffect, useRef, useState } from 'react'

type ShoppingListActionsOptions = {
  guests: number
  hasMenu: boolean
  shoppingText: string
}

/** Инкапсулирует браузерные действия: clipboard, share и скачивание файла. */
export function useShoppingListActions({
  guests,
  hasMenu,
  shoppingText,
}: ShoppingListActionsOptions) {
  const [notice, setNotice] = useState('')

  // useRef хранит изменяемое значение между рендерами, но его изменение само
  // по себе не вызывает новый рендер. Здесь ref запоминает id таймера, чтобы
  // отменить предыдущий таймер при быстром повторном нажатии.
  const noticeTimerRef = useRef<number | null>(null)

  const flash = useCallback((message: string) => {
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current)
    setNotice(message)
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 2200)
  }, [])

  // Cleanup гарантирует, что таймер не попытается изменить состояние после
  // ухода пользователя со страницы.
  useEffect(() => () => {
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current)
  }, [])

  const copyList = useCallback(async () => {
    if (!hasMenu) return
    await navigator.clipboard.writeText(shoppingText)
    flash('Список скопирован')
  }, [flash, hasMenu, shoppingText])

  const shareList = useCallback(async () => {
    if (!hasMenu) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Список продуктов', text: shoppingText })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        throw error
      }
      return
    }
    await copyList()
  }, [copyList, hasMenu, shoppingText])

  const downloadList = useCallback(() => {
    if (!hasMenu) return
    const blob = new Blob([shoppingText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `spisok-produktov-${guests}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    flash('Файл сохранён')
  }, [flash, guests, hasMenu, shoppingText])

  return { copyList, downloadList, notice, shareList }
}
