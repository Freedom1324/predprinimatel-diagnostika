/**
 * STORAGE — сохранение прохождений в "базу".
 *
 * MVP: без внешних зависимостей и без сети (см. README) — используется append-only
 * JSON Lines файл (data/respondents.jsonl). Один респондент = одна строка JSON.
 * Формат записи соответствует ТЗ п.9 (+ аналитические поля из ТЗ п.13).
 *
 * Интерфейс (save/getAll/getById) сделан так, чтобы при переходе на реальную БД
 * (Postgres/SQLite) поменять нужно было только этот файл.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { SCORING_VERSION } from '../config/rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// По умолчанию — data/ в корне приложения, НЕ зависит от process.cwd() (откуда запущен node).
const DEFAULT_FILE = path.resolve(__dirname, '../../data/respondents.jsonl');

function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '');
}

export class RespondentRepository {
  constructor(filePath = DEFAULT_FILE) {
    this.filePath = filePath;
    ensureFile(this.filePath);
  }

  /**
   * @param {object} params
   * @returns {object} сохранённая запись (с respondent_id и created_at)
   */
  save({ answers, scores, indexes, primaryProfile, secondaryProfile, resultStatus, analytics }) {
    const record = {
      respondent_id: randomUUID(),
      created_at: new Date().toISOString(),
      scoring_version: SCORING_VERSION,
      business_stage: answers.q1 || null,
      team_size: answers.q2 || null,
      answers,
      scores,
      indexes,
      primary_profile: primaryProfile,
      secondary_profile: secondaryProfile,
      result_status: resultStatus,
      purchase_intent: analytics?.purchase_intent ?? null,
      preferred_help_format: analytics?.preferred_help_format ?? null,
      analytics: analytics || null,
      contact: null, // заполняется отдельным вызовом saveContact при отправке CTA-формы
    };
    fs.appendFileSync(this.filePath, JSON.stringify(record) + '\n');
    return record;
  }

  /**
   * Прикрепляет контакт (имя + email/telegram) к уже сохранённому прохождению —
   * используется после клика по CTA "Получить разбор" (ТЗ п.12).
   */
  saveContact(respondentId, contact) {
    const all = this.getAll();
    const idx = all.findIndex((r) => r.respondent_id === respondentId);
    if (idx === -1) return null;
    all[idx].contact = contact;
    all[idx].contact_submitted_at = new Date().toISOString();
    fs.writeFileSync(this.filePath, all.map((r) => JSON.stringify(r)).join('\n') + '\n');
    return all[idx];
  }

  getAll() {
    const content = fs.readFileSync(this.filePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  getById(respondentId) {
    return this.getAll().find((r) => r.respondent_id === respondentId) || null;
  }

  count() {
    return this.getAll().length;
  }
}
