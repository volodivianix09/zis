# TODO: "Здесь и сейчас"

## Единственная метрика MVP

> **Сколько прогулок заканчиваются реальной встречей**

---

# ✅ ФАЗА 1 — MUST HAVE (ЗАВЕРШЕНА)

## E2E Flow: человек → прогулка → встреча

- [x] Telegram auth — вход и создание профиля
- [x] Создание прогулки — форма, выбор формата, времени, кол-ва людей
- [x] Карта — Yandex Maps + кластеризация + bottom sheet
- [x] Nearby — PostGIS запрос прогулок в радиусе 3 км
- [x] Отклик на прогулку — join API + проверка мест
- [x] Входящие заявки — принятие/отклонение (Activity tab)
- [x] Чат — Realtime сообщения (Supabase Realtime / SQLite polling)
- [x] Список чатов — активные прогулки с последним сообщением
- [x] Системные сообщения — "Участник присоединился"
- [x] Принятие заявки → статус "active"
- [x] Авто-завершение просроченных прогулок

## Profile

- [x] Аватар, имя, био, рейтинг
- [x] Статус верификации
- [ ] Редактирование био
- [ ] Выход из аккаунта

## Инфраструктура

- [x] Supabase проект `zdis` — создан, таблицы, PostGIS, RLS, geo-функция
- [x] Telegram Bot `@here_n_now_bot` — токен, имя, Mini App меню
- [x] Yandex Maps API ключ — JavaScript API
- [x] Local DB (SQLite) для разработки
- [x] Supabase/Production режим (USE_LOCAL_DB=false)
- [x] Git — 2 коммита, репозиторий инициализирован

## Известные баги / мелкие доработки

- [ ] Yandex Maps "api already enabled" warning (не влияет)
- [ ] Activity tab может не показывать данные при первом входе (refresh решает)
- [ ] Пустой state для "Нет прогулок" на карте

---

# 🟡 ФАЗА 2 — TRUST LAYER

- [ ] Liveness: реальный MediaPipe (blink detection + random challenge)
- [ ] Liveness: проверка перед созданием/откликом
- [ ] Rate limiting: не больше 5 прогулок в час
- [ ] Жалоба на пользователя
- [ ] Базовая модерация контента

---

# 🟢 ФАЗА 3 — SCALE

- [ ] Push-уведомления (Telegram Bot API)
- [ ] Matching engine upgrade
- [ ] Dev panel (/dev — если нужно)
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Sentry / Vercel Analytics)
- [ ] Premium / подписка
- [ ] Рейтинг и отзывы
- [ ] Групповые прогулки
- [ ] PWA: офлайн-режим + реальные PNG иконки
- [ ] E2E шифрование чатов

---

# 🔴 СЕЙЧАС — ДЕПЛОЙ

- [ ] Создать GitHub репозиторий → git push
- [ ] Vercel: Import from GitHub → добавить env vars → Deploy
- [ ] Vercel: переключить `USE_LOCAL_DB=false`
- [ ] @BotFather: `/setmenubutton` → указать URL продакшна
- [ ] Ручной тест: 2 человека → 1 встреча

---

## Статус

**Фаза 1 — 95% готово.** Осталось: задеплоить и протестировать E2E на живом URL.
