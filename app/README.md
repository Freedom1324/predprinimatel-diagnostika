# Онлайн-диагностика предпринимателя — MVP

Веб-приложение из 20 вопросов, которое определяет ведущий "профиль узкого места"
предпринимателя (операционка / ручной труд / клиенты / зависимость от владельца /
неупакованный рост) и показывает персональный разбор с рекомендацией формата помощи.

## Стек и ограничения

Никаких внешних npm-зависимостей: сеть в среде разработки недоступна, поэтому
всё собрано на встроенных модулях Node.js (`http`, `fs`, `node:test`) и ванильном
HTML/CSS/JS без сборщика. Это осознанное решение для MVP, не архитектурное ограничение —
при необходимости бэкенд можно перевести на Express/Fastify + Postgres, не трогая
`engine/` и `config/`.

## Структура проекта

```
src/
  config/      — QUESTIONS, SCORING CONFIG (матрица баллов), PROFILES, RULES (пороги/капы)
  engine/      — scoringEngine, normalization, profileDetection, resultGenerator
  analytics/   — аналитические поля (purchase_intent, срезы и т.п.)
  storage/     — сохранение прохождений (JSON Lines, data/respondents.jsonl)
  server/      — HTTP API (без Express) + отдача статики
  public/      — фронтенд: index.html, css/, js/ (app.js — состояние, screens.js — рендер)
tests/         — node:test (unit + интеграционные через реальный HTTP)
data/          — создаётся при первом запуске/сохранении
```

Скоринговая матрица (`config/scoringMatrix.js`) — единственное место с баллами.
UI и API-роуты её не дублируют: клиент получает только тексты вопросов
(`GET /api/questions`) и названия профилей без баллов (`GET /api/profile-titles`),
весь расчёт происходит на сервере (`POST /api/submit`).

## Запуск

```bash
npm start          # старт сервера на http://localhost:3000 (порт — переменная PORT)
npm test           # весь набор тестов (node --test)
```

Открыть `http://localhost:3000` в браузере — анкета из 20 вопросов, затем экран результата.

## API

- `GET /api/questions` — вопросы и варианты ответов (без баллов).
- `GET /api/profile-titles` — человекочитаемые названия 5 профилей.
- `POST /api/submit` — `{ answers, startedAt }` → `{ respondent_id, result }`.
- `POST /api/contact` — `{ respondent_id, name, contact }` → привязка контакта к CTA.

## Данные

`data/respondents.jsonl` — по одной JSON-записи на прохождение (append-only).
Формат записи соответствует ТЗ (п.9 и п.13): ответы, сырые баллы, индексы,
primary/secondary, purchase_intent, preferred_help_format, contact.
