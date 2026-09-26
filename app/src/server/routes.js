/**
 * API ROUTES.
 *
 * Ключевая архитектурная граница MVP: клиент НИКОГДА не получает scoringMatrix.js.
 * - GET  /api/questions  -> только тексты вопросов/вариантов (QUESTIONS), без баллов.
 * - POST /api/submit     -> сервер сам считает scores/indexes/status и возвращает готовый результат.
 * - POST /api/contact    -> сохраняет контакт по CTA.
 */

import { QUESTIONS } from '../config/questions.js';
import { PROFILES } from '../config/profiles.js';
import { calculateScores, calculateMaxPossibleScores, ScoringError } from '../engine/scoringEngine.js';
import { normalizeScores } from '../engine/normalization.js';
import { determineProfiles } from '../engine/profileDetection.js';
import { generateResult } from '../engine/resultGenerator.js';
import { buildAnalyticsRecord } from '../analytics/analyticsFields.js';
import { sendContactNotification } from '../notifications/emailNotifier.js';



/**
 * Отдаём фронтенду вопросы без единого числа баллов.
 */
export function getPublicQuestions() {
  return QUESTIONS.map((q) => ({
    id: q.id,
    field: q.field || null,
    text: q.text,
    type: q.type,
    options: q.options || null,
    required: q.required,
    freeTextField: q.freeTextField || false,
  }));
}

/**
 * Только человекочитаемые названия профилей (без кодов-объяснений веса, без баллов) —
 * нужно UI, чтобы подписать разбивку "Профиль по зонам" на экране результата, не показывая
 * пользователю технические коды OPS/AI/CRM/OWNER/GROWTH напрямую (ТЗ п.11).
 */
export function getPublicProfileTitles() {
  const titles = {};
  for (const [code, p] of Object.entries(PROFILES)) {
    titles[code] = p.title;
  }
  return titles;
}

function validateRequiredAnswers(answers) {
  const missing = [];
  for (const q of QUESTIONS) {
    const key = q.id.toLowerCase();
    if (q.type === 'multi') {
      if (!Array.isArray(answers[key]) || answers[key].length === 0) missing.push(q.id);
    } else if (q.type === 'open_text') {
      if (!answers.q12_category) missing.push('Q12');
    } else {
      if (!answers[key]) missing.push(q.id);
    }
  }
  return missing;
}

export function handleSubmit(body, repository) {
  const { answers, startedAt } = body;
  if (!answers || typeof answers !== 'object') {
    return { status: 400, body: { error: 'answers обязателен' } };
  }

  const missing = validateRequiredAnswers(answers);
  if (missing.length > 0) {
    return { status: 400, body: { error: 'Не все обязательные вопросы отвечены', missing } };
  }

  let raw;
  try {
    raw = calculateScores(answers);
  } catch (e) {
    if (e instanceof ScoringError) {
      return { status: 400, body: { error: e.message } };
    }
    throw e;
  }

  const max = calculateMaxPossibleScores();
  const indexes = normalizeScores(raw, max);
  const detection = determineProfiles(indexes);
  const result = generateResult({ indexes, detection, answers });

  const finishedAt = new Date().toISOString();
  const analytics = buildAnalyticsRecord({
    answers,
    raw,
    indexes,
    detection,
    startedAt: startedAt || null,
    finishedAt,
  });

  const record = repository.save({
    answers,
    scores: raw,
    indexes,
    primaryProfile: detection.primary,
    secondaryProfile: detection.secondary,
    resultStatus: detection.status,
    analytics,
  });

  return {
    status: 200,
    body: {
      respondent_id: record.respondent_id,
      result,
    },
  };
}

export async function handleContact(body, repository) {
  const { respondent_id, name, contact } = body;
  if (!respondent_id || !name || !contact) {
    return { status: 400, body: { error: 'respondent_id, name и contact обязательны' } };
  }
  const updated = repository.saveContact(respondent_id, { name, contact });
  if (!updated) {
    return { status: 404, body: { error: 'Респондент не найден' } };
  }
  await sendContactNotification({ name, contact, record: updated });
  return { status: 200, body: { ok: true } };
}
