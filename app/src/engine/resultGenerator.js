/**
 * RESULT GENERATOR + OFFER
 *
 * generateResult(...) собирает финальный ответ для пользователя (ТЗ п.11):
 * заголовок, объяснение, 2–4 сигнала, что делать первым, рекомендуемый формат,
 * вторичная зона (если применимо). Технические коды профилей наружу не отдаются.
 *
 * Сигналы формируются из фактически выбранных ответов пользователя, которые сильнее
 * всего "весят" в пользу ведущего профиля (а не из отдельного заранее заданного текста —
 * такого текста нет ни в ТЗ, ни в Excel). Это осознанное решение по умолчанию; если
 * нужен другой набор формулировок сигналов — задать отдельным текстовым полем в profiles.js.
 */

import { getProfile } from '../config/profiles.js';
import { SCORING_MATRIX } from '../config/scoringMatrix.js';
import { RESULT_STATUS } from './profileDetection.js';
import { roundIndex } from './normalization.js';
import { INDEX_DISPLAY_PRECISION } from '../config/rules.js';
import { Q20_FORMAT_OPTIONS } from '../config/scoringMatrix.js';

const SIGNAL_SOURCE_QUESTIONS = ['Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q10', 'Q13', 'Q14', 'Q15', 'Q16', 'Q18'];

/**
 * Находит до `limit` ответов пользователя, которые больше всего "весят" в пользу
 * указанного профиля, и возвращает их текст как готовые формулировки сигналов.
 */
function extractSignals(answers, profileCode, limit = 3) {
  const candidates = [];

  for (const qid of SIGNAL_SOURCE_QUESTIONS) {
    const key = qid.toLowerCase();
    const value = answers[key];
    if (!value) continue;
    const opt = SCORING_MATRIX[qid]?.find((o) => o.option === value);
    if (opt && (opt.scores[profileCode] || 0) > 0) {
      candidates.push({ text: opt.option, weight: opt.scores[profileCode] });
    }
  }

  // Q9 / Q17 — мультивыбор, каждый выбранный пункт с ненулевым весом — отдельный кандидат.
  for (const qid of ['Q9', 'Q17']) {
    const key = qid.toLowerCase();
    const values = answers[key] || [];
    for (const value of values) {
      const opt = SCORING_MATRIX[qid]?.find((o) => o.option === value);
      if (opt && (opt.scores[profileCode] || 0) > 0) {
        candidates.push({ text: opt.option, weight: opt.scores[profileCode] });
      }
    }
  }

  candidates.sort((a, b) => b.weight - a.weight);

  const seen = new Set();
  const signals = [];
  for (const c of candidates) {
    if (seen.has(c.text)) continue;
    seen.add(c.text);
    signals.push(c.text);
    if (signals.length >= limit) break;
  }

  if (signals.length < 2) {
    signals.push(getProfile(profileCode).signalsSummary);
  }

  return signals.slice(0, Math.max(limit, 2)).slice(0, 4);
}

function preferredFormatLabel(answers) {
  const value = answers.q20;
  if (!value) return null;
  const found = Q20_FORMAT_OPTIONS.find((o) => o.option === value);
  return found ? found.option : value;
}

/**
 * @param {object} params
 * @param {Record<string, number>} params.indexes
 * @param {{primary:string|null, secondary:string|null, status:string, leadingZones:string[]|null}} params.detection
 * @param {object} params.answers - сырые ответы (для извлечения сигналов и формата)
 * @returns {object} результат для пользователя
 */
export function generateResult({ indexes, detection, answers }) {
  const { primary, secondary, status, leadingZones } = detection;

  const indexesDisplay = {};
  for (const [code, value] of Object.entries(indexes)) {
    indexesDisplay[code] = roundIndex(value, INDEX_DISPLAY_PRECISION);
  }

  const base = {
    status,
    indexes: indexesDisplay,
    preferredHelpFormat: preferredFormatLabel(answers),
  };

  if (status === RESULT_STATUS.NO_DOMINANT) {
    return {
      ...base,
      title: 'Явного ведущего профиля пока нет',
      explanation:
        'Ни один из профилей не набрал достаточной выраженности, чтобы уверенно назвать его ведущим. Это нормальный результат — он тоже говорит о текущем состоянии бизнеса.',
      signals: [],
      firstStep:
        'Стоит пройти диагностику ещё раз через некоторое время или обсудить ситуацию отдельно — единого узкого места пока не выявлено.',
      recommendation: null,
      primaryProfile: null,
      secondaryProfile: null,
      offer: null,
    };
  }

  if (status === RESULT_STATUS.TWO_LEADING_ZONES) {
    const [codeA, codeB] = leadingZones;
    const profileA = getProfile(codeA);
    const profileB = getProfile(codeB);
    return {
      ...base,
      title: `Две ведущие зоны внимания: «${profileA.title}» и «${profileB.title}»`,
      explanation:
        'Два направления выражены практически одинаково сильно — сложно выделить одно как основное. Обе зоны стоит рассматривать вместе.',
      signals: [...new Set([...extractSignals(answers, codeA, 2), ...extractSignals(answers, codeB, 2)])].slice(
        0,
        4
      ),
      firstStep: `${profileA.recommendation} Параллельно: ${profileB.recommendation.toLowerCase()}`,
      recommendation: null,
      primaryProfile: { code: codeA, title: profileA.title },
      secondaryProfile: { code: codeB, title: profileB.title },
      offer: [profileA.offer, profileB.offer],
    };
  }

  const primaryProfile = getProfile(primary);
  const secondaryProfile = secondary ? getProfile(secondary) : null;

  return {
    ...base,
    title: `Ваш ведущий профиль: «${primaryProfile.title}»`,
    explanation: primaryProfile.explanation,
    signals: extractSignals(answers, primary, 3),
    firstStep: primaryProfile.recommendation,
    recommendation: primaryProfile.recommendation,
    primaryProfile: { code: primaryProfile.code, title: primaryProfile.title },
    secondaryProfile: secondaryProfile
      ? { code: secondaryProfile.code, title: secondaryProfile.title, note: secondaryProfile.explanation }
      : null,
    offer: primaryProfile.offer,
  };
}
