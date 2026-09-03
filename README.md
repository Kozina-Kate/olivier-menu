# Оливье

Конструктор домашнего меню: пользователь выбирает блюда и число гостей, а
сервис рассчитывает общий список продуктов. Первый рецепт — классический салат
Оливье.

## Архитектура

- `apps/web` — React + TypeScript + Vite;
- `backend` — Django, Django REST Framework и встроенная админка;
- `packages/core` — общие типы и расчёты для веба и будущего React Native;
- `apps/mobile` — место для будущего приложения Expo.

Рецепты хранятся в PostgreSQL (локально можно использовать SQLite) и
редактируются через Django Admin. Веб и будущее мобильное приложение читают их
через единый API `/api/v1/`.

## Локальный запуск

Нужны Python 3.13+ и Node.js 22.12+.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python backend/manage.py migrate
.venv/bin/python backend/manage.py seed_olivier
.venv/bin/python backend/manage.py runserver
```

В другом терминале:

```bash
nvm use
npm install
npm run dev:web
```

Если `nvm` не установлен, используйте любую версию Node.js не ниже 22.12.

- сайт: <http://localhost:5173>
- API: <http://localhost:8000/api/v1/recipes/>
- админка: <http://localhost:8000/admin/>

Для входа в админку локально создайте пользователя:

```bash
.venv/bin/python backend/manage.py createsuperuser
```

## Автотесты

Перед запуском frontend-тестов выберите версию Node.js из `.nvmrc`:

```bash
nvm use
npm run test:web
```

Команда запускает Vitest один раз и завершается. Для разработки в режиме,
который автоматически перезапускает тесты после изменения файлов:

```bash
npm run test:watch --workspace @olivier/web
```

Backend-тесты запускаются отдельно:

```bash
.venv/bin/python backend/manage.py test recipes
```

Секреты не должны попадать в Git. Переменные окружения перечислены в
`.env.example`.

## Текущий MVP

- динамический каталог из Django с поиском по названию и ингредиентам;
- фильтры по категории, времени и сложности;
- выбор нескольких блюд и количества гостей;
- объединение одинаковых ингредиентов в общем списке покупок;
- автоматическое появление опубликованных в админке рецептов на сайте;
- пошаговое приготовление, фотографии и ссылки на видео;
- список покупок с отметками;
- копирование, системное меню «Поделиться» и скачивание `.txt`;
- единый read-only API для веба и будущего мобильного приложения.
