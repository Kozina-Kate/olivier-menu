import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  envDir: '../../',
  plugins: [react()],
  test: {
    // jsdom имитирует браузер: document, window и другие Web API становятся
    // доступны тестам, хотя сами тесты запускаются из командной строки.
    environment: 'jsdom',
    // Этот файл подключает дополнительные DOM-проверки перед каждым тестом.
    setupFiles: './src/test/setup.ts',
  },
})
