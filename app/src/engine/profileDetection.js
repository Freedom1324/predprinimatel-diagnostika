/**
 * PROFILE DETECTION
 *
 * determineProfiles(indexes) -> { primary, secondary, status }
 *
 * Правила (ТЗ п.7 + Excel 03_Формулы):
 *  - PRIMARY: максимальный PROFILE_INDEX, если он >= PRIMARY_THRESHOLD (40%).
 *  - Если максимум < PRIMARY_THRESHOLD -> status = NO_DOMINANT, primary/secondary = null.
 *  - Если разрыв между 1-м и 2-м профилем (в п.п.) <= CLOSE_TOP_MAX_GAP_PP (5) ->
 *    status = TWO_LEADING_ZONES. Это правило ПРИОРИТЕТНЕЕ обычного secondary
 *    (см. Excel 03_Формулы, строка CLOSE_TOP: "показывать 'две ведущие зоны',
 *    а не жёстко разделять") — в этом случае primary/secondary как пара
 *    "ведущий/вторичный" не выставляются, вместо этого возвращается leadingZones
 *    с обоими профилями.
 *  - Иначе SECONDARY: индекс >= SECONDARY_MIN_INDEX (45%) И отставание от
 *    primary <= SECONDARY_MAX_GAP_PP (15 п.п.). Если не выполняется — secondary = null,
 *    status = PRIMARY_ONLY.
 *
 * Порядок применения правил закреплён здесь как единственный источник истины —
 * дублировать эту логику в других местах (UI, аналитика) нельзя.
 */

import { PROFILE_CODES } from '../config/scoringMatrix.js';
import {
  PRIMARY_THRESHOLD,
  SECONDARY_MIN_INDEX,
  SECONDARY_MAX_GAP_PP,
  CLOSE_TOP_MAX_GAP_PP,
} from '../config/rules.js';

export const RESULT_STATUS = {
  NO_DOMINANT: 'NO_DOMINANT',
  TWO_LEADING_ZONES: 'TWO_LEADING_ZONES',
  PRIMARY_ONLY: 'PRIMARY_ONLY',
  PRIMARY_AND_SECONDARY: 'PRIMARY_AND_SECONDARY',
};

/**
 * @param {Record<string, number>} indexes - PROFILE_INDEX по каждому профилю (float, 0..100)
 * @returns {{
 *   primary: string|null,
 *   secondary: string|null,
 *   status: string,
 *   leadingZones: string[]|null,
 *   ranked: {profile:string, index:number}[]
 * }}
 */
export function determineProfiles(indexes) {
  const ranked = PROFILE_CODES.map((p) => ({ profile: p, index: indexes[p] })).sort(
    (a, b) => b.index - a.index
  );

  const top1 = ranked[0];
  const top2 = ranked[1];

  if (top1.index < PRIMARY_THRESHOLD) {
    return {
      primary: null,
      secondary: null,
      status: RESULT_STATUS.NO_DOMINANT,
      leadingZones: null,
      ranked,
    };
  }

  const gapTop1Top2 = top1.index - top2.index;

  if (gapTop1Top2 <= CLOSE_TOP_MAX_GAP_PP) {
    return {
      primary: top1.profile,
      secondary: top2.profile,
      status: RESULT_STATUS.TWO_LEADING_ZONES,
      leadingZones: [top1.profile, top2.profile],
      ranked,
    };
  }

  const secondaryQualifies =
    top2.index >= SECONDARY_MIN_INDEX && gapTop1Top2 <= SECONDARY_MAX_GAP_PP;

  if (secondaryQualifies) {
    return {
      primary: top1.profile,
      secondary: top2.profile,
      status: RESULT_STATUS.PRIMARY_AND_SECONDARY,
      leadingZones: null,
      ranked,
    };
  }

  return {
    primary: top1.profile,
    secondary: null,
    status: RESULT_STATUS.PRIMARY_ONLY,
    leadingZones: null,
    ranked,
  };
}
