# PostgreSQL и production-конфигурация

## Локальный PostgreSQL

Для приложения достаточно запустить только базу данных в Docker:

```bash
docker compose up -d db
```

Затем задайте URL базы в корневом `.env` или в окружении терминала:

```dotenv
DATABASE_URL=postgresql://olivier:olivier-local@127.0.0.1:5432/olivier
DATABASE_SSL_REQUIRE=false
```

Примените миграции и загрузите демонстрационные данные:

```bash
.venv/bin/python backend/manage.py migrate
.venv/bin/python backend/manage.py seed_demo
```

Проверить состояние контейнера можно командой `docker compose ps`. Остановить
базу без удаления данных — `docker compose stop db`. Именованный volume
`postgres_data` сохраняется между запусками.

## Обязательные production-переменные

В production установите:

```dotenv
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<уникальная случайная строка длиной не менее 50 символов>
DJANGO_ALLOWED_HOSTS=api.example.com
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
DATABASE_SSL_REQUIRE=true
CORS_ALLOWED_ORIGINS=https://example.com
CSRF_TRUSTED_ORIGINS=https://example.com,https://api.example.com
VITE_API_URL=https://api.example.com/api/v1
```

При `DJANGO_DEBUG=false` приложение не стартует без безопасного секретного
ключа, списка разрешённых хостов и PostgreSQL в `DATABASE_URL` — SQLite остаётся
только локальным вариантом. HTTPS-редирект, secure cookies и доверие к заголовку
reverse proxy включаются автоматически. Если провайдер завершает TLS не на
proxy, настройку `DJANGO_SECURE_SSL_REDIRECT` нужно согласовать с его схемой
сети.

`DATABASE_SSL_REQUIRE` по умолчанию включён для PostgreSQL в production и
выключен в локальной разработке. `DATABASE_CONN_MAX_AGE` управляет временем
жизни соединений и по умолчанию равен 600 секундам; Django также проверяет
соединение перед повторным использованием.

HSTS по умолчанию не включается, чтобы первый ошибочный деплой не заблокировал
домен в браузерах. После проверки HTTPS задайте, например,
`DJANGO_SECURE_HSTS_SECONDS=3600`, а затем постепенно увеличьте срок. Флаги для
поддоменов и preload включайте только когда HTTPS гарантирован для всех
поддоменов.

## Первый запуск и обновления

После создания production-базы и перед запуском новой версии выполните:

```bash
python backend/manage.py migrate --noinput
python backend/manage.py collectstatic --noinput
python backend/manage.py check --deploy
```

Перед миграциями рабочей базы настройте автоматические резервные копии у
провайдера и проверьте восстановление на отдельной базе. Пароли и полный
`DATABASE_URL` храните только в менеджере секретов хостинга — не в Git и не в
образе приложения.

CI поднимает PostgreSQL 17 как сервис, применяет все миграции и запускает
backend-тесты с `DJANGO_DEBUG=false`. SQLite остаётся быстрым вариантом для
разработки, но основной проверяемый контур соответствует production-СУБД.
