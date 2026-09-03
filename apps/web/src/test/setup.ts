import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library создаёт HTML-разметку внутри виртуального document.
// После каждого теста очищаем её, чтобы результаты одного сценария не влияли
// на следующий. Изоляция тестов делает ошибки воспроизводимыми.
afterEach(() => {
  cleanup()
})
