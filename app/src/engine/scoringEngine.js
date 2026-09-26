/**
 * SCORING ENGINE
 *
 * calculateScores(answers) -> RAW_SCORE по каждому профилю (с учётом капов Q9/Q12/Q17
 * и коммерческого сигнала Q19). Это единственное место, где ответы пользователя
 * встречаются с матрицей баллов (scoringMatrix.js).
 *
 * Сюда НЕ входит нормализация (деление на MAX_POSSIBLE_SCORE) — это normalization.js.
 */

import { SCORING_MATRIX, PROFILE_CODES, Q12_CATEGORY_SCORES, Q19_OPTIONS } from '../config/scoringMatrix.js';
import { CAPS } from '../config/rules.js';

function emptyScores() {
  const s = {};
  for (const p of PROFILE_CODES) s[p] = 0;
  return s;
}

function addScores(target, scores) {
  for (const p of PROFILE_CODES) target[p] += scores[p] || 0;
}

function findOption(questionId, optionText) {
  const opts = SCORING_MATRIX[questionId];
  if (!opts) return null;
  return opts.find((o) => o.option === optionText) || null;
}

/**
 * Одиночный вопрос: answers[qid] — строка (текст выбранного варианта).
 */
function scoreSingleQuestion(questionId, answerValue, raw) {
  if (!answerValue) return;
  const found = findOption(questionId, answerValue);
  if (!found) {
    throw new ScoringError(`Неизвестный вариант ответа для ${questionId}: "${answerValue}"`);
  }
  addScores(raw, found.scores);
}

/**
 * Мультивыбор (Q9, Q17): answers[qid] — массив строк.
 * Вклад суммируется по всем выбранным вариантам, затем капается по каждому профилю отдельно.
 */
function scoreMultiQuestion(questionId, answerValues, raw, capKey) {
  if (!answerValues || answerValues.length === 0) return;
  const sum = emptyScores();
  for (const value of answerValues) {
    const found = findOption(questionId, value);
    if (!found) {
      throw new ScoringError(`Неизвестный вариант ответа для ${questionId}: "${value}"`);
    }
    addScores(sum, found.scores);
  }
  const cap = CAPS[capKey];
  for (const p of PROFILE_CODES) {
    raw[p] += Math.min(sum[p], cap);
  }
}

/**
 * Q12 — открытый ответ, закодированный в категорию (answers.q12_category).
 * Свободный текст (answers.q12_text) в скоринге не участвует, сохраняется отдельно для аналитики.
 */
function scoreQ12(categoryValue, raw) {
  if (!categoryValue) return;
  const scores = Q12_CATEGORY_SCORES[categoryValue];
  if (!scores) {
    throw new ScoringError(`Неизвестная категория Q12: "${categoryValue}"`);
  }
  const cap = CAPS.Q12;
  for (const p of PROFILE_CODES) {
    raw[p] += Math.min(scores[p] || 0, cap);
  }
}

/**
 * Q19 — коммерческий сигнал: +1 соответствующему профилю.
 */
function scoreQ19(answerValue, raw) {
  if (!answerValue) return;
  const found = Q19_OPTIONS.find((o) => o.option === answerValue);
  if (!found) {
    throw new ScoringError(`Неизвестный вариант ответа для Q19: "${answerValue}"`);
  }
  if (found.profile) {
    raw[found.profile] += 1;
  }
}

export class ScoringError extends Error {}

/**
 * @param {object} answers - объект ответов, ключи вида q3, q4, ... q19 (single: string,
 *   multi: string[], q12_category: string, q12_text: string).
 * @returns {{OPS:number, AI:number, CRM:number, OWNER:number, GROWTH:number}}
 */
export function calculateScores(answers) {
  const raw = emptyScores();

  scoreSingleQuestion('Q3', answers.q3, raw);
  scoreSingleQuestion('Q4', answers.q4, raw);
  scoreSingleQuestion('Q5', answers.q5, raw);
  scoreSingleQuestion('Q6', answers.q6, raw);
  scoreSingleQuestion('Q7', answers.q7, raw);
  scoreSingleQuestion('Q8', answers.q8, raw);
  scoreMultiQuestion('Q9', answers.q9, raw, 'Q9');
  scoreSingleQuestion('Q10', answers.q10, raw);
  // Q11 — модификатор, в скоринг не входит.
  scoreQ12(answers.q12_category, raw);
  scoreSingleQuestion('Q13', answers.q13, raw);
  scoreSingleQuestion('Q14', answers.q14, raw);
  scoreSingleQuestion('Q15', answers.q15, raw);
  scoreSingleQuestion('Q16', answers.q16, raw);
  scoreMultiQuestion('Q17', answers.q17, raw, 'Q17');
  scoreSingleQuestion('Q18', answers.q18, raw);
  scoreQ19(answers.q19, raw);
  // Q1, Q2, Q20 — вне скоринга.

  return raw;
}

/**
 * Теоретический максимум RAW_SCORE по каждому профилю — вычисляется из текущей
 * матрицы (а не хранится захардкоженным числом), чтобы не расходиться с ней
 * при будущих правках весов. Для каждого вопроса берётся лучший (максимальный)
 * вариант ответа для данного профиля; для Q9/Q17 — сумма всех вариантов, капнутая;
 * для Q12 — максимальная категория, капнутая; Q19 — максимум +1.
 */
export function calculateMaxPossibleScores() {
  const max = emptyScores();

  const singleQs = ['Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q10', 'Q13', 'Q14', 'Q15', 'Q16', 'Q18'];
  for (const qid of singleQs) {
    const opts = SCORING_MATRIX[qid];
    for (const p of PROFILE_CODES) {
      max[p] += Math.max(...opts.map((o) => o.scores[p] || 0));
    }
  }

  for (const [qid, capKey] of [['Q9', 'Q9'], ['Q17', 'Q17']]) {
    const opts = SCORING_MATRIX[qid];
    const cap = CAPS[capKey];
    for (const p of PROFILE_CODES) {
      const sumAll = opts.reduce((acc, o) => acc + (o.scores[p] || 0), 0);
      max[p] += Math.min(sumAll, cap);
    }
  }

  {
    const cap = CAPS.Q12;
    for (const p of PROFILE_CODES) {
      const best = Math.max(...Object.values(Q12_CATEGORY_SCORES).map((s) => s[p] || 0));
      max[p] += Math.min(best, cap);
    }
  }

  for (const p of PROFILE_CODES) {
    max[p] += 1; // Q19
  }

  return max;
}
