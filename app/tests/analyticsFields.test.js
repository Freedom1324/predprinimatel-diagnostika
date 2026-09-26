import test from 'node:test';
import assert from 'node:assert/strict';
import { getPurchaseIntent, getPreferredHelpFormat, buildAnalyticsRecord, aggregateSlices } from '../src/analytics/analyticsFields.js';
import { Q19_OPTIONS } from '../src/config/scoringMatrix.js';
import { RESULT_STATUS } from '../src/engine/profileDetection.js';

test('getPurchaseIntent: возвращает ответ и связанный профиль', () => {
  const opt = Q19_OPTIONS[0];
  const intent = getPurchaseIntent({ q19: opt.option });
  assert.equal(intent.answer, opt.option);
  assert.equal(intent.relatedProfile, opt.profile);
});

test('getPurchaseIntent: пусто, если Q19 не отвечен', () => {
  assert.equal(getPurchaseIntent({}), null);
});

test('getPreferredHelpFormat: берёт q20 как есть', () => {
  assert.equal(getPreferredHelpFormat({ q20: 'Постоянная поддержка' }), 'Постоянная поддержка');
  assert.equal(getPreferredHelpFormat({}), null);
});

test('buildAnalyticsRecord: считает длительность в секундах', () => {
  const rec = buildAnalyticsRecord({
    answers: {},
    raw: {},
    indexes: {},
    detection: { primary: 'OPS', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY },
    startedAt: '2026-01-01T10:00:00.000Z',
    finishedAt: '2026-01-01T10:05:30.000Z',
  });
  assert.equal(rec.duration_seconds, 330);
});

test('buildAnalyticsRecord: duration=null, если нет startedAt', () => {
  const rec = buildAnalyticsRecord({
    answers: {},
    raw: {},
    indexes: {},
    detection: { primary: 'OPS', secondary: null, status: RESULT_STATUS.PRIMARY_ONLY },
    startedAt: null,
    finishedAt: '2026-01-01T10:05:30.000Z',
  });
  assert.equal(rec.duration_seconds, null);
});

test('aggregateSlices: агрегирует по профилю и purchase_intent', () => {
  const records = [
    { primary_profile: 'OPS', purchase_intent: 'Делегирование', preferred_help_format: 'Настройка под ключ' },
    { primary_profile: 'OPS', purchase_intent: 'Делегирование', preferred_help_format: 'Только рекомендации' },
    { primary_profile: 'AI', purchase_intent: null, preferred_help_format: null },
  ];
  const { byProfileIntent, byProfileFormat } = aggregateSlices(records);
  assert.equal(byProfileIntent['OPS::Делегирование'], 2);
  assert.equal(byProfileIntent['AI::NONE'], 1);
  assert.equal(byProfileFormat['OPS::Настройка под ключ'], 1);
});
