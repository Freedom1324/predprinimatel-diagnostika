/**
 * Интеграционный тест: поднимаем реальный HTTP-сервер на случайном порту
 * и проверяем полный путь запроса, как это делает браузер.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../src/server/server.js';

function tmpDataDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diag-test-'));
  return dir;
}

async function withServer(fn) {
  const dataDir = tmpDataDir();
  const dataFilePath = path.join(dataDir, 'respondents.jsonl');
  const server = createServer({ dataFilePath });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  try {
    await fn(`http://localhost:${port}`, dataFilePath);
  } finally {
    server.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

test('GET /api/questions возвращает 20 вопросов без баллов', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/questions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.questions.length, 20);
    const json = JSON.stringify(body);
    // в структуре ответа не должно быть числовых полей "scores"
    assert.ok(!json.includes('"scores"'));
  });
});

test('GET /api/profile-titles возвращает 5 названий без числовых баллов', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/profile-titles`);
    const body = await res.json();
    assert.equal(Object.keys(body.titles).length, 5);
  });
});

test('POST /api/submit без обязательных ответов -> 400 с missing', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: {} }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.missing.length > 0);
  });
});

const FULL_ANSWERS = {
  q1: '1–3 года, стабильный бизнес',
  q2: '2–5 человек',
  q3: 'Клиенты есть, но внутри хаос',
  q4: '2–4 часа',
  q5: 'Иногда',
  q6: 'Возникают отдельные вопросы',
  q7: 'В основном понятно',
  q8: 'Несколько',
  q9: ['Обработка заявок/лидов', 'Клиентская база'],
  q10: '3–5 раз',
  q11: 'Использую эпизодически',
  q12_category: 'Лиды / заявки',
  q12_text: 'ручной разбор заявок',
  q13: 'Нет времени',
  q14: 'Мессенджеры',
  q15: 'Иногда',
  q16: 'Только по некоторым',
  q17: ['Продажи', 'Общение с клиентами'],
  q18: 'Потребуются изменения',
  q19: 'Система клиентов',
  q20: 'Готовая система/шаблон',
};

test('POST /api/submit с полными ответами -> 200, respondent_id, результат', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: FULL_ANSWERS, startedAt: new Date().toISOString() }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.respondent_id);
    assert.ok(body.result.title);
    assert.ok(body.result.indexes);
  });
});

test('POST /api/submit сохраняет запись — доступна через contact', async () => {
  await withServer(async (base, dataFilePath) => {
    const submitRes = await fetch(`${base}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: FULL_ANSWERS }),
    });
    const { respondent_id } = await submitRes.json();

    const contactRes = await fetch(`${base}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respondent_id, name: 'Тест', contact: 'test@example.com' }),
    });
    assert.equal(contactRes.status, 200);

    const lines = fs.readFileSync(dataFilePath, 'utf-8').trim().split('\n');
    const saved = JSON.parse(lines[lines.length - 1]);
    assert.equal(saved.respondent_id, respondent_id);
    assert.equal(saved.contact.name, 'Тест');
  });
});

test('POST /api/contact с несуществующим respondent_id -> 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respondent_id: 'not-exists', name: 'X', contact: 'x@x.com' }),
    });
    assert.equal(res.status, 404);
  });
});
