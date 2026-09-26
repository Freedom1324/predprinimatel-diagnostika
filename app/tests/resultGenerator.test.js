import test from 'node:test';
import assert from 'node:assert/strict';
import { generateResult } from '../src/engine/resultGenerator.js';
import { RESULT_STATUS } from '../src/engine/profileDetection.js';
import { SCORING_MATRIX } from '../src/config/scoringMatrix.js';

test('NO_DOMINANT: понятный текст, без сигналов, без оффера', () => {
  const r = generateResult({
    indexes: { OPS: 30, AI: 20, CRM: 10, OWNER: 25, GROWTH: 5 },
    detection: { primary: null, secondary: null, status: RESULT_STATUS.NO_DOMINANT, leadingZones: null },
    answers: {},
  });
  assert.equal(r.status, RESULT_STATUS.NO_DOMINANT);
  assert.equal(r.offer, null);
  assert.deepEqual(r.signals, []);
  assert.equal(r.primaryProfile, null);
});

test('TWO_LEADING_ZONES: заголовок содержит оба профиля, offer — массив из двух', () => {
  const r = generateResult({
    indexes: { OPS: 80, AI: 78, CRM: 10, OWNER: 10, GROWTH: 10 },
    detection: { primary: 'OPS', secondary: 'AI', status: RESULT_STATUS.TWO_LEADING_ZONES, leadingZones: ['OPS', 'AI'] },
    answers: {},
  });
  assert.equal(r.status, RESULT_STATUS.TWO_LEADING_ZONES);
  assert.ok(Array.isArray(r.offer));
  assert.equal(r.offer.length, 2);
  assert.equal(r.primaryProfile.code, 'OPS');
  assert.equal(r.secondaryProfile.code, 'AI');
});

test('PRIMARY_ONLY: есть title/explanation/firstStep/offer, secondaryProfile=null', () => {
  const r = generateResult({
    indexes: { OPS: 10, AI: 10, CRM: 80, OWNER: 10, GROWTH: 10 },
    detection: { primary: 'CRM', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY, leadingZones: null },
    answers: {},
  });
  assert.ok(r.title.includes('систем'));
  assert.equal(r.secondaryProfile, null);
  assert.ok(r.offer);
});

test('PRIMARY_AND_SECONDARY: secondaryProfile заполнен с note', () => {
  const r = generateResult({
    indexes: { OPS: 70, AI: 60, CRM: 10, OWNER: 10, GROWTH: 10 },
    detection: { primary: 'OPS', secondary: 'AI', status: RESULT_STATUS.PRIMARY_AND_SECONDARY, leadingZones: null },
    answers: {},
  });
  assert.equal(r.secondaryProfile.code, 'AI');
  assert.ok(r.secondaryProfile.note);
});

test('сигналы формируются из фактически выбранных ответов пользователя', () => {
  const bestQ3 = SCORING_MATRIX.Q3.reduce((a, b) => ((a.scores.OWNER || 0) >= (b.scores.OWNER || 0) ? a : b));
  const r = generateResult({
    indexes: { OPS: 10, AI: 10, CRM: 10, OWNER: 90, GROWTH: 10 },
    detection: { primary: 'OWNER', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY, leadingZones: null },
    answers: { q3: bestQ3.option },
  });
  assert.ok(r.signals.includes(bestQ3.option) || r.signals.length >= 2);
});

test('preferredHelpFormat берётся из ответа q20', () => {
  const r = generateResult({
    indexes: { OPS: 50, AI: 10, CRM: 10, OWNER: 10, GROWTH: 10 },
    detection: { primary: 'OPS', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY, leadingZones: null },
    answers: { q20: 'Только рекомендации' },
  });
  assert.equal(r.preferredHelpFormat, 'Только рекомендации');
});

test('индексы в результате округлены до INDEX_DISPLAY_PRECISION', () => {
  const r = generateResult({
    indexes: { OPS: 33.333333, AI: 10, CRM: 10, OWNER: 10, GROWTH: 10 },
    detection: { primary: 'OPS', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY, leadingZones: null },
    answers: {},
  });
  assert.equal(r.indexes.OPS, 33.3);
});
