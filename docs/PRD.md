# Product Requirements Document (PRD)
## Goal Dashboard — Дашборд отслеживания выручки в реальном времени

**Версия:** 0.1.0
**Дата:** 11 марта 2026
**Автор:** На основе анализа кодовой базы

---

## 1. Executive Summary

### Проблема
Малому и среднему бизнесу сложно отслеживать прогресс достижения финансовых целей (выручка за месяц/квартал) в реальном времени. Данные разбросаны по разным банкам, требуется ручной мониторинг, нет визуализации для команды.

### Решение
Goal Dashboard — веб-приложение для автоматического сбора транзакций из российских банков (Точка, Т-Банк) и визуализации прогресса к финансовой цели. TV-режим позволяет выводить дашборд на офисный экран для мотивации команды.

### Критерии успеха
| Метрика | Цель |
|---------|------|
| Время синхронизации данных | < 30 секунд на один банковский аккаунт |
| Актуальность данных | Автообновление каждые 10 минут |
| Uptime | 99.5% |
| Задержка отображения | < 200ms для рендеринга прогресса |
| Точность прогноза | ±5% от реальной даты достижения цели |

---

## 2. User Experience & Functionality

### Пользовательские персоны

| Персона | Описание | Потребности |
|---------|----------|-------------|
| **Владелец бизнеса** | Руководитель малого бизнеса, 30-50 лет | Видеть общую картину выручки, мотивировать команду |
| **Финансовый менеджер** | Ведёт учёт, работает с банками | Быстрый доступ к транзакциям, синхронизация с банками |
| **Офисный сотрудник** | Видит TV-дашборд в офисе | Понятная визуализация прогресса без взаимодействия |

### User Stories

#### US-1: Регистрация и вход
**Как** новый пользователь
**Хочу** зарегистрироваться по email/паролю
**Чтобы** получить доступ к системе

**Acceptance Criteria:**
- Email + пароль (минимум 8 символов)
- Первый зарегистрированный пользователь = администратор
- Сессия сохраняется 7 дней
- Cookie-based аутентификация (Better Auth)

#### US-2: Подключение банка
**Как** пользователь
**Хочу** подключить банковский счёт
**Чтобы** автоматически получать транзакции

**Acceptance Criteria:**
- Точка Банк: OAuth 2.0 авторизация
- Т-Банк: mTLS сертификат + токен
- Токены шифруются AES-256-GCM перед сохранением в БД
- Можно подключить несколько счетов разных банков

#### US-3: Создание цели
**Как** пользователь
**Хочу** создать финансовую цель
**Чтобы** отслеживать прогресс к ней

**Acceptance Criteria:**
- Название, целевая сумма, валюта (RUB/USD/EUR)
- Период: дата начала и окончания
- Выбор типа транзакций: доходы, расходы, или оба
- Опционально: привязка к конкретным счетам
- Только одна активная цель одновременно

#### US-4: Просмотр прогресса
**Как** пользователь
**Хочу** видеть прогресс к цели
**Чтобы** понимать, успеваю ли я

**Acceptance Criteria:**
- Текущая сумма / целевая сумма
- Процент выполнения (визуальный progress bar)
- Статус темпа: Опережаем (+10%), По плану (±5%), Отстаём (-5-20%), Под угрозой (<-20%)
- Прогноз даты достижения цели
- Статистика за сегодня и вчера

#### US-5: TV-режим
**Как** офисный сотрудник
**Хочу** видеть прогресс на большом экране
**Чтобы** быть мотивированным

**Acceptance Criteria:**
- Fullscreen по клику
- Увеличенные шрифты (10rem для главного числа)
- Часы в углу экрана
- Индикатор синхронизации (LIVE/SYNC)
- Автообновление каждые 30 секунд
- Цветовая индикация статуса (зелёный -> жёлтый -> красный)

#### US-6: Ручное добавление транзакций
**Как** пользователь
**Хочу** добавить транзакцию вручную
**Чтобы** учесть наличные или переводы из других источников

**Acceptance Criteria:**
- Выбор счёта, сумма, тип (доход/расход)
- Контрагент, описание (опционально)
- Дата выполнения

### Non-Goals (вне скоупа v1.0)
- Мобильное приложение
- Уведомления (push/email/telegram)
- Несколько активных целей одновременно
- Командные аккаунты (multi-tenancy на уровне организации)
- Экспорт отчётов (PDF/Excel)
- Интеграция с другими банками (Сбер, Альфа, ВТБ)
- Аналитика и графики трендов

---

## 3. Technical Specifications

### Архитектура

```
+----------------------------------------------------------+
|                      Client (Browser)                     |
|  +-----------+  +-----------+  +-------------------+     |
|  | Dashboard |  | Settings  |  |   TV Mode         |     |
|  |  (SSR)    |  |   (SSR)   |  |   (Client+Hooks)  |     |
|  +-----------+  +-----------+  +-------------------+     |
|       |              |                |                   |
|  +----+--------------+----------------+------+           |
|  |     React Hooks (useAutoRefresh,          |           |
|  |     useBankSync, useFullscreen)           |           |
|  +-------------------------------------------+           |
+----------------------------------------------------------+
                           |
                           v
+----------------------------------------------------------+
|                   Next.js 14 (App Router)                 |
|  +-----------------------------------------------------+ |
|  |                   API Routes                         | |
|  |  /api/auth/*      -> Better Auth                    | |
|  |  /api/goals/*     -> CRUD goals                     | |
|  |  /api/accounts/*  -> Bank account management        | |
|  |  /api/banks/*     -> OAuth callbacks, connect       | |
|  |  /api/sync        -> Sync transactions              | |
|  |  /api/transactions -> Manual transactions           | |
|  +-----------------------------------------------------+ |
|  +-----------------------------------------------------+ |
|  |                Middleware                            | |
|  |  - Session validation                                | |
|  |  - Rate limiting (10 req/min on /api/sync)          | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
                           |
          +----------------+----------------+
          v                v                v
+--------------+   +--------------+   +--------------+
|  PostgreSQL  |   |  Tochka API  |   |  T-Bank API  |
|   (Drizzle)  |   |   (OAuth)    |   |   (mTLS)     |
+--------------+   +--------------+   +--------------+
```

### Стек технологий

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Framework | Next.js (App Router) | 14.2.x |
| Runtime | Node.js | >=20.0 |
| UI | React | 18.3.x |
| Styling | Tailwind CSS | 3.4.x |
| Auth | Better Auth | 1.2.x |
| Database | PostgreSQL + Drizzle ORM | 0.30.x |
| Validation | Zod | 3.23.x |
| HTTP Client | Axios | 1.7.x |
| Date Utils | date-fns | 3.6.x |
| ID Generation | @paralleldrive/cuid2 | 2.2.x |

### Схема базы данных

```
+--------------------------+
|         user             |  <- Better Auth
+--------------------------+
| id: text (PK)            |
| email: text              |
| emailVerified: boolean   |
| name: text               |
| image: text              |
| createdAt: timestamp     |
| updatedAt: timestamp     |
+--------------------------+
            |
            | 1:N
            v
+--------------------------+
|     bank_accounts        |
+--------------------------+
| id: text (PK, cuid2)     |
| userId: text (FK)        |
| bank: enum(TOCHKA,TBANK) |
| accountId: text          |
| accountName: text        |
| currency: text (RUB)     |
| accessToken: text [enc]  |
| refreshToken: text [enc] |
| tokenExpiry: timestamp   |
| isActive: boolean        |
| lastSyncAt: timestamp    |
| createdAt: timestamp     |
| updatedAt: timestamp     |
+--------------------------+
| UNIQUE(userId,bank,      |
|        accountId)        |
+--------------------------+
            |
            | 1:N
            v
+--------------------------+
|      transactions        |
+--------------------------+
| id: text (PK, cuid2)     |
| userId: text (FK)        |
| bankAccountId: text (FK) |
| externalId: text         |
| amount: decimal(15,2)    |
| currency: text           |
| type: enum(INCOME,       |
|            EXPENSE)      |
| counterparty: text       |
| description: text        |
| executedAt: timestamp    |
| createdAt: timestamp     |
+--------------------------+
| UNIQUE(bankAccountId,    |
|        externalId)       |
| INDEX(userId, type,      |
|       executedAt)        |
+--------------------------+

+--------------------------+
|         goals            |
+--------------------------+
| id: text (PK, cuid2)     |
| userId: text (FK)        |
| name: text               |
| targetAmount: decimal    |
| currency: text           |
| startDate: timestamp     |
| endDate: timestamp       |
| accountIds: text[]       |
| trackIncome: boolean     |
| trackExpense: boolean    |
| isActive: boolean        |
| createdAt: timestamp     |
| updatedAt: timestamp     |
+--------------------------+

+--------------------------+
|       sync_logs          |
+--------------------------+
| id: text (PK, cuid2)     |
| userId: text (FK)        |
| bankAccountId: text      |
| status: enum(RUNNING,    |
|         SUCCESS, FAILED) |
| message: text            |
| transactionsAdded: int   |
| startedAt: timestamp     |
| completedAt: timestamp   |
+--------------------------+
```

### API Endpoints

| Method | Endpoint | Описание | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/sign-up` | Регистрация | - |
| POST | `/api/auth/sign-in/email` | Вход | - |
| POST | `/api/auth/sign-out` | Выход | Yes |
| GET | `/api/auth/get-session` | Текущая сессия | Yes |
| GET | `/api/goals` | Список активных целей | Yes |
| POST | `/api/goals` | Создать цель | Yes |
| GET | `/api/goals/[id]` | Цель с прогрессом | Yes |
| GET | `/api/goals/[id]/stats` | Статистика цели | Yes |
| DELETE | `/api/goals/[id]` | Деактивировать цель | Yes |
| GET | `/api/accounts` | Список счетов | Yes |
| DELETE | `/api/accounts/[id]` | Удалить счёт | Yes |
| GET | `/api/banks/tochka` | Начать OAuth Точка | Yes |
| GET | `/api/banks/tochka/callback` | OAuth callback | - |
| POST | `/api/banks/tbank` | Подключить Т-Банк | Yes |
| POST | `/api/sync` | Синхронизация (rate limited) | Yes |
| GET | `/api/transactions` | Список транзакций | Yes |
| POST | `/api/transactions` | Добавить вручную | Yes |

### Интеграции с банками

#### Точка Банк
- **Протокол:** OAuth 2.0
- **Scope:** accounts, statements
- **Token refresh:** Автоматически перед истечением
- **Документация:** https://i.tochka.com/bank/services/m/integration/new

#### Т-Банк (ex-Тинькофф Бизнес)
- **Протокол:** mTLS + Bearer token
- **Сертификаты:** Клиентские сертификаты из T-Business Dashboard
- **Документация:** Личный кабинет T-Business

### Security & Privacy

| Аспект | Реализация |
|--------|------------|
| Аутентификация | Better Auth (email/password), session cookies |
| Шифрование токенов | AES-256-GCM (`crypto.ts`) |
| CSRF защита | OAuth state validation |
| Rate limiting | 10 req/min на `/api/sync` |
| mTLS | Для Т-Банк production API |
| Сессии | httpOnly cookies, 7 дней TTL |
| Пароли | Минимум 8 символов, хеширование Better Auth |

---

## 4. Бизнес-логика

### Расчёт прогресса цели

```typescript
progress = Sum(INCOME transactions) - Sum(EXPENSE transactions)
         для периода [startDate, endDate]
         для выбранных accountIds (или всех)

percent = min(progress / targetAmount * 100, 100)
```

### Расчёт темпа (Pace)

```typescript
totalDays = endDate - startDate
daysElapsed = now - startDate
expectedPercent = (daysElapsed / totalDays) * 100
percentDiff = actualPercent - expectedPercent

status =
  percentDiff >= +10  -> "ahead"    (Опережаем)
  percentDiff >= -5   -> "ontrack"  (По плану)
  percentDiff >= -20  -> "behind"   (Отстаём)
  else                -> "atrisk"   (Под угрозой)

dailyRate = currentAmount / daysElapsed
daysToComplete = (targetAmount - currentAmount) / dailyRate
forecastDate = now + daysToComplete
```

### Цикл синхронизации

1. Client-side hook `useBankSync` запускается каждые 10 минут
2. `POST /api/sync` -> Rate limit check -> Session validation
3. Для каждого активного `bank_account`:
   - Refresh token if needed
   - Fetch transactions from bank API (last 30 days)
   - Upsert transactions (dedupe by `externalId`)
   - Update `lastSyncAt`
   - Log to `sync_logs`
4. Return summary (added/updated count)
5. Client refreshes page data

---

## 5. Risks & Roadmap

### Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Банк API недоступен | Средняя | Высокое | Retry с exponential backoff, показывать последние данные |
| OAuth токен истекает во время sync | Средняя | Среднее | Auto-refresh перед операцией |
| Rate limit банка | Низкая | Среднее | Batch запросы, кэширование |
| Ошибки в расчёте прогноза | Низкая | Низкое | Unit-тесты для `goals.ts` |

### Roadmap

#### MVP (v0.1.0) - DONE
- [x] Better Auth аутентификация
- [x] Подключение Точка/Т-Банк
- [x] Создание целей
- [x] Визуализация прогресса
- [x] TV-режим
- [x] Client-side sync (10 мин)

#### v1.0.0 (Planned)
- [ ] Email уведомления о статусе цели
- [ ] Telegram бот для быстрого просмотра
- [ ] Фильтрация транзакций по контрагенту
- [ ] История целей (архив)

#### v1.1.0 (Future)
- [ ] Несколько активных целей
- [ ] Графики трендов (Chart.js)
- [ ] Экспорт в Excel/PDF
- [ ] Интеграция Сбер Business

#### v2.0.0 (Vision)
- [ ] Multi-tenant (организации)
- [ ] Роли (admin/viewer)
- [ ] Виджеты для Notion/Slack
- [ ] Mobile PWA

---

## 6. Deployment

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/goal_dashboard
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://your-domain.com
ENCRYPTION_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Tochka Bank (optional)
TOCHKA_CLIENT_ID=
TOCHKA_CLIENT_SECRET=
TOCHKA_REDIRECT_URI=https://your-domain.com/api/banks/tochka/callback

# T-Bank (optional)
TBANK_CERT_PATH=/path/to/cert.pem
TBANK_KEY_PATH=/path/to/key.pem
TBANK_CERT_PASSWORD=
```

### Docker

```bash
docker compose up -d
```

### Database Setup

```bash
pnpm db:push   # Create tables
pnpm db:studio # Admin UI
```

---

*Документ сгенерирован на основе анализа кодовой базы `goal-dashboard` версии 0.1.0*
