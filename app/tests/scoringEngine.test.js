import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScores, calculateMaxPossibleScores, ScoringError } from '../src/engine/scoringEngine.js';
import { SCORING_MATRIX, Q12_CATEGORY_SCORES, Q19_OPTIONS } from '../src/config/scoringMatrix.js';
import { CAPS } from '../src/config/rules.js';

test('calculateScores: пустые ответы -> все нули', () => {
  const raw = calculateScores({});
  assert.deepEqual(raw, { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 });
});

test('calculateScores: одиночный вопрос добавляет правильные баллы', () => {
  const opt = SCORING_MATRIX.Q3[0];
  const raw = calculateScores({ q3: opt.option });
  for (const p of Object.keys(raw)) {
    assert.equal(raw[p], opt.scores[p] || 0);
  }
});

test('calculateScores: неизвестный вариант ответа -> ScoringError', () => {
  assert.throws(() => calculateScores({ q3: 'такого варианта нет' }), ScoringError);
});

test('calculateScores: Q9 мультивыбор суммируется, но капается CAPS.Q9', () => {
  const allOptions = SCORING_MATRIX.Q9.map((o) => o.option);
  const raw = calculateScores({ q9: allOptions });
  for (const p of Object.keys(raw)) {
    const sumAll = SCORING_MATRIX.Q9.reduce((acc, o) => acc + (o.scores[p] || 0), 0);
    assert.equal(raw[p], Math.min(sumAll, CAPS.Q9));
  }
});

test('calculateScores: Q17 мультивыбор капается CAPS.Q17', () => {
  const allOptions = SCORING_MATRIX.Q17.map((o) => o.option);
  const raw = calculateScores({ q17: allOptions });
  for (const p of Object.keys(raw)) {
    const sumAll = SCORING_MATRIX.Q17.reduce((acc, o) => acc + (o.scores[p] || 0), 0);
    assert.equal(raw[p], Math.min(sumAll, CAPS.Q17));
  }
});

test('calculateScores: Q9 частичный выбор не капается, если сумма меньше капа', () => {
  const [first] = SCORING_MATRIX.Q9;
  const raw = calculateScores({ q9: [first.option] });
  for (const p of Object.keys(raw)) {
    assert.equal(raw[p], Math.min(first.scores[p] || 0, CAPS.Q9));
  }
});

test('calculateScores: Q12 категория капается CAPS.Q12', () => {
  const categories = Object.keys(Q12_CATEGORY_SCORES);
  for (const cat of categories) {
    const raw = calculateScores({ q12_category: cat });
    for (const p of Object.keys(raw)) {
      assert.equal(raw[p], Math.min(Q12_CATEGORY_SCORES[cat][p] || 0, CAPS.Q12));
    }
  }
});

test('calculateScores: Q12 неизвестная категория -> ScoringError', () => {
  assert.throws(() => calculateScores({ q12_category: 'не существует' }), ScoringError);
});

test('calculateScores: Q19 добавляет ровно +1 соответствующему профилю', () => {
  for (const opt of Q19_OPTIONS) {
    const raw = calculateScores({ q19: opt.option });
    for (const p of Object.keys(raw)) {
      if (p === opt.profile) assert.equal(raw[p], 1);
      else assert.equal(raw[p], 0);
    }
  }
});

test('calculateScores: комбинация нескольких вопросов суммируется корректно', () => {
  const q3opt = SCORING_MATRIX.Q3[1];
  const q4opt = SCORING_MATRIX.Q4[2];
  const raw = calculateScores({ q3: q3opt.option, q4: q4opt.option });
  for (const p of Object.keys(raw)) {
    assert.equal(raw[p], (q3opt.scores[p] || 0) + (q4opt.scores[p] || 0));
  }
});

test('calculateMaxPossibleScores: возвращает положительные числа для всех профилей', () => {
  const max = calculateMaxPossibleScores();
  for (const p of Object.keys(max)) {
    assert.ok(max[p] > 0, `${p} max should be > 0`);
  }
});

test('calculateMaxPossibleScores: RAW_SCORE никогда не превышает MAX_POSSIBLE при любых ответах из матрицы', () => {
  const max = calculateMaxPossibleScores();
  // Собираем ответы, максимизирующие один конкретный профиль (OWNER), и проверяем, что ни один raw не превышает max.
  const answers = {
    q3: bestFor(SCORING_MATRIX.Q3, 'OWNER'),
    q4: bestFor(SCORING_MATRIX.Q4, 'OWNER'),
    q5: bestFor(SCORING_MATRIX.Q5, 'OWNER'),
    q6: bestFor(SCORING_MATRIX.Q6, 'OWNER'),
    q7: bestFor(SCORING_MATRIX.Q7, 'OWNER'),
    q8: bestFor(SCORING_MATRIX.Q8, 'OWNER'),
    q9: SCORING_MATRIX.Q9.map((o) => o.option),
    q10: bestFor(SCORING_MATRIX.Q10, 'OWNER'),
    q12_category: bestCategoryFor(Q12_CATEGORY_SCORES, 'OWNER'),
    q13: bestFor(SCORING_MATRIX.Q13, 'OWNER'),
    q14: bestFor(SCORING_MATRIX.Q14, 'OWNER'),
    q15: bestFor(SCORING_MATRIX.Q15, 'OWNER'),
    q16: bestFor(SCORING_MATRIX.Q16, 'OWNER'),
    q17: SCORING_MATRIX.Q17.map((o) => o.option),
    q18: bestFor(SCORING_MATRIX.Q18, 'OWNER'),
  };
  const raw = calculateScores(answers);
  for (const p of Object.keys(raw)) {
    assert.ok(raw[p] <= max[p], `${p}: raw=${raw[p]} должен быть <= max=${max[p]}`);
  }
  assert.equal(raw.OWNER, max.OWNER - 1); // -1, т.к. Q19 не отвечен в этом тесте (макс включает Q19=+1)
});

function bestFor(options, profile) {
  let best = options[0];
  for (const o of options) {
    if ((o.scores[profile] || 0) > (best.scores[profile] || 0)) best = o;
  }
  return best.option;
}

function bestCategoryFor(map, profile) {
  let bestKey = null;
  let bestVal = -Infinity;
  for (const [key, scores] of Object.entries(map)) {
    if ((scores[profile] || 0) > bestVal) {
      bestVal = scores[profile] || 0;
      bestKey = key;
    }
  }
  return bestKey;
}
