/**
 * ANALYTICS FIELDS (ТЗ п.13)
 *
 * Вычисляет поля, которые нужны не для показа пользователю, а для последующего
 * анализа рынка: purchase_intent, preferred_help_format, срезы "Профиль × Purchase Intent"
 * и "Профиль × Preferred Format", тайминги и т.д. Ничего из этого не пересчитывает скоринг —
 * только читает уже посчитанные raw/index/primary/secondary и сырые ответы.
 */

import { Q19_OPTIONS } from '../config/scoringMatrix.js';

/**
 * PURCHASE_INTENT — отдельное значение Q19, не влияющее напрямую на профиль
 * (хотя тот же ответ и даёт +1 профилю в scoringEngine — здесь просто фиксируем сырой факт).
 */
export function getPurchaseIntent(answers) {
  const value = answers.q19;
  if (!value) return null;
  const found = Q19_OPTIONS.find((o) => o.option === value);
  return {
    answer: value,
    relatedProfile: found ? found.profile : null,
  };
}

export function getPreferredHelpFormat(answers) {
  return answers.q20 || null;
}

/**
 * Собирает полный аналитический "слепок" одного прохождения для сохранения в базу.
 * @param {object} params
 */
export function buildAnalyticsRecord({ answers, raw, indexes, detection, startedAt, finishedAt }) {
  const purchaseIntent = getPurchaseIntent(answers);
  const preferredHelpFormat = getPreferredHelpFormat(answers);

  const durationSeconds =
    startedAt && finishedAt ? Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000) : null;

  return {
    started_at: startedAt || null,
    finished_at: finishedAt || null,
    duration_seconds: durationSeconds,
    raw_scores: raw,
    indexes,
    primary_profile: detection.primary,
    secondary_profile: detection.secondary,
    result_status: detection.status,
    purchase_intent: purchaseIntent ? purchaseIntent.answer : null,
    purchase_intent_related_profile: purchaseIntent ? purchaseIntent.relatedProfile : null,
    preferred_help_format: preferredHelpFormat,
    // Срезы считаются агрегированно по множеству записей на уровне репозитория/админки,
    // здесь фиксируются только сырые поля, по которым срез строится.
    slice_profile_x_purchase_intent: {
      profile: detection.primary,
      purchase_intent: purchaseIntent ? purchaseIntent.answer : null,
    },
    slice_profile_x_preferred_format: {
      profile: detection.primary,
      preferred_help_format: preferredHelpFormat,
    },
  };
}

/**
 * Агрегация срезов по массиву сохранённых записей (для простой admin-статистики, этап 4).
 */
export function aggregateSlices(records) {
  const byProfileIntent = {};
  const byProfileFormat = {};

  for (const r of records) {
    const profile = r.primary_profile || 'NONE';

    const intentKey = `${profile}::${r.purchase_intent || 'NONE'}`;
    byProfileIntent[intentKey] = (byProfileIntent[intentKey] || 0) + 1;

    const formatKey = `${profile}::${r.preferred_help_format || 'NONE'}`;
    byProfileFormat[formatKey] = (byProfileFormat[formatKey] || 0) + 1;
  }

  return { byProfileIntent, byProfileFormat };
}
