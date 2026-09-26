/**
 * NORMALIZATION
 *
 * PROFILE_INDEX = RAW_SCORE / MAX_POSSIBLE_SCORE * 100  (ТЗ п.6).
 *
 * Хранится и передаётся дальше как float (без округления) — округление до
 * INDEX_DISPLAY_PRECISION знаков применяется только на выводе (result generator / UI),
 * чтобы сравнения порогов (40%, 45%, 15пп, 5пп) не зависели от округления.
 */

import { PROFILE_CODES } from '../config/scoringMatrix.js';

/**
 * @param {Record<string, number>} rawScores
 * @param {Record<string, number>} maxScores
 * @returns {Record<string, number>} индексы в процентах (float, 0..100)
 */
export function normalizeScores(rawScores, maxScores) {
  const indexes = {};
  for (const p of PROFILE_CODES) {
    const max = maxScores[p];
    if (!max || max <= 0) {
      indexes[p] = 0;
      continue;
    }
    indexes[p] = (rawScores[p] / max) * 100;
  }
  return indexes;
}

export function roundIndex(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
