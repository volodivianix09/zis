# Здесь и сейчас

Социальный on-demand сервис для прогулок. Найди компанию для прогулки здесь и сейчас.

## Стек

- **Frontend:** Next.js 15 + Tailwind CSS + Yandex Maps
- **Backend:** Supabase (PostgreSQL + PostGIS + Realtime)
- **Auth:** Telegram Web App SDK
- **Liveness:** MediaPipe (face detection)
- **Deployment:** Vercel + Supabase Cloud

## Возможности

- Карта с активными прогулками
- Создание прогулок с выбором формата, района, времени
- Отклик на прогулки
- Liveness check (проверка живого человека)
- Чаты для каждой прогулки
- Профиль с рейтингом и верификацией
- Telegram Mini App + PWA

## Установка

```bash
npm install
```

## Настройка

1. Создайте Supabase проект на https://supabase.com
2. Включите PostGIS extension в SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Выполните миграции из `supabase/migrations/`
4. Создайте Telegram бота через @BotFather
5. Настройте Mini App URL в BotFather
6. Получите API ключ Yandex Maps на https://developer.tech.yandex.ru/
7. Скопируйте `.env.local.example` в `.env.local` и заполните:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   TELEGRAM_BOT_TOKEN=your-bot-token
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
   NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your-yandex-maps-key
   ```

## Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## Структура проекта

```
src/
├── app/                    # Next.js App Router страницы
│   ├── api/                # API routes
│   ├── activity/           # Активность
│   ├── chats/              # Чаты
│   ├── profile/            # Профиль
│   └── walk/               # Создание прогулок
├── components/             # React компоненты
│   ├── liveness/           # Liveness check
│   ├── map/                # Карта
│   ├── ui/                 # UI компоненты
│   └── ...
├── hooks/                  # React hooks + Zustand stores
├── lib/                    # Утилиты и клиенты
│   ├── supabase/           # Supabase клиенты
│   ├── telegram/           # Telegram SDK
│   ├── geo/                # Гео-утилиты
│   └── matching/           # Matching engine
└── types/                  # TypeScript типы

supabase/
└── migrations/             # SQL миграции
```

## Деплой

### Vercel

1. Подключите GitHub репозиторий
2. Добавьте переменные окружения в Vercel dashboard
3. Deploy

### Supabase

1. Создайте проект
2. Выполните миграции
3. Настройте Row Level Security (уже в миграциях)
4. Включите Realtime для таблиц `messages` и `walks`

## Лицензия

MIT
