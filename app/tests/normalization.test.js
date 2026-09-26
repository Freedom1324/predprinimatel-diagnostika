import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScores, roundIndex } from '../src/engine/normalization.js';

test('normalizeScores: базовая формула RAW/MAX*100', () => {
  const raw = { OPS: 23, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 };
  const max = { OPS: 46, AI: 46, CRM: 31, OWNER: 48, GROWTH: 27 };
  const idx = normalizeScores(raw, max);
  assert.equal(idx.OPS, 50);
  assert.equal(idx.AI, 0);
});

test('normalizeScores: max=0 не даёт деления на ноль, индекс=0', () => {
  const raw = { OPS: 5, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 };
  const max = { OPS: 0, AI: 46, CRM: 31, OWNER: 48, GROWTH: 27 };
  const idx = normalizeScores(raw, max);
  assert.equal(idx.OPS, 0);
});

test('normalizeScores: raw=max -> индекс=100', () => {
  const max = { OPS: 46, AI: 46, CRM: 31, OWNER: 48, GROWTH: 27 };
  const idx = normalizeScores(max, max);
  for (const p of Object.keys(idx)) assert.equal(idx[p], 100);
});

test('roundIndex: округляет до заданной точности', () => {
  assert.equal(roundIndex(33.3333, 1), 33.3);
  assert.equal(roundIndex(33.3333, 0), 33);
  assert.equal(roundIndex(33.35, 1), 33.4);
});
