import assert from 'node:assert/strict';
import test from 'node:test';
import '../public/demo-engine.js';
const d = globalThis.DSADemo;

test('all searches handle found, missing, single-value and equal-value arrays', () => {
  for (const kind of ['linear', 'binary', 'interpolation']) {
    for (const values of [[1], [2, 2, 2], [-4, 0, 3, 7], [1, 2, 100, 9999]]) {
      for (const target of [-5, 0, 1, 2, 3, 7, 99, 9999]) {
        const result = d.search(kind, values, target);
        assert.equal(result.index >= 0, values.includes(target));
        if (result.index >= 0) assert.equal(values[result.index], target);
      }
    }
  }
});
test('invalid and unsorted inputs are rejected', () => {
  for (const raw of ['', '1,no', '1.5', '10000']) assert.throws(() => d.parseList(raw));
  assert.throws(() => d.parseList(Array(13).fill('1').join(',')));
  for (const kind of ['binary', 'interpolation']) assert.throws(() => d.search(kind, [3, 1], 1));
  assert.deepEqual(d.parseList(' -3, 0  5 '), [-3, 0, 5]);
});
test('probing handles negative keys, wraparound, duplicates and full tables', () => {
  assert.deepEqual(d.probing([-1, 2, 5], 3).slots, [2, 5, -1]);
  assert.equal(d.probing([1, 1], 3).slots.filter(x => x !== null).length, 1);
  assert.match(d.probing([1, 2, 3], 2).steps.at(-1).message, /Table full/);
  for (const size of [0, 1, 14, 2.5]) assert.throws(() => d.probing([1], size));
});
