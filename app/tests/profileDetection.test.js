import test from 'node:test';
import assert from 'node:assert/strict';
import { determineProfiles, RESULT_STATUS } from '../src/engine/profileDetection.js';

const flat = { OPS: 10, AI: 10, CRM: 10, OWNER: 10, GROWTH: 10 };

test('NO_DOMINANT: максимум < 40%', () => {
  const r = determineProfiles({ ...flat, OPS: 39.9 });
  assert.equal(r.status, RESULT_STATUS.NO_DOMINANT);
  assert.equal(r.primary, null);
  assert.equal(r.secondary, null);
});

test('граница 40 ровно -> уже не NO_DOMINANT', () => {
  const r = determineProfiles({ ...flat, OPS: 40 });
  assert.notEqual(r.status, RESULT_STATUS.NO_DOMINANT);
  assert.equal(r.primary, 'OPS');
});

test('TWO_LEADING_ZONES: разрыв топ1/топ2 ровно 5пп', () => {
  const r = determineProfiles({ OPS: 50, AI: 45, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.equal(r.status, RESULT_STATUS.TWO_LEADING_ZONES);
  assert.deepEqual(new Set(r.leadingZones), new Set(['OPS', 'AI']));
});

test('разрыв 5.1пп -> уже НЕ TWO_LEADING_ZONES', () => {
  const r = determineProfiles({ OPS: 50.1, AI: 45, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.notEqual(r.status, RESULT_STATUS.TWO_LEADING_ZONES);
});

test('PRIMARY_AND_SECONDARY: secondary >=45% и разрыв <=15пп', () => {
  const r = determineProfiles({ OPS: 60, AI: 45, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.equal(r.status, RESULT_STATUS.PRIMARY_AND_SECONDARY);
  assert.equal(r.primary, 'OPS');
  assert.equal(r.secondary, 'AI');
});

test('secondary отклонён: индекс 44.9% (< 45%)', () => {
  const r = determineProfiles({ OPS: 60, AI: 44.9, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.equal(r.status, RESULT_STATUS.PRIMARY_ONLY);
  assert.equal(r.secondary, null);
});

test('secondary отклонён: разрыв 15.1пп (> 15пп)', () => {
  const r = determineProfiles({ OPS: 60.1, AI: 45, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.equal(r.status, RESULT_STATUS.PRIMARY_ONLY);
  assert.equal(r.secondary, null);
});

test('граница разрыва ровно 15пп -> secondary принимается', () => {
  const r = determineProfiles({ OPS: 60, AI: 45, CRM: 10, OWNER: 10, GROWTH: 10 });
  assert.equal(r.status, RESULT_STATUS.PRIMARY_AND_SECONDARY);
});

test('ranked отсортирован по убыванию индекса', () => {
  const r = determineProfiles({ OPS: 10, AI: 90, CRM: 50, OWNER: 20, GROWTH: 5 });
  const values = r.ranked.map((x) => x.index);
  const sorted = [...values].sort((a, b) => b - a);
  assert.deepEqual(values, sorted);
});
