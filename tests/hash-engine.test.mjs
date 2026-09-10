import assert from 'node:assert/strict';
import test from 'node:test';
import '../public/hash-engine.js';
const { hash, Table, methods, strategies, DELETED } = globalThis.DSAHash;

test('hash examples use documented extraction conventions', () => {
  assert.equal(hash(-26).index, 7);
  assert.equal(hash(1234, { method: 'mid-square', size: 31 }).index, 22);
  assert.equal(hash(26, { method: 'multiplication', size: 10 }).index, 0);
  for (const method of methods) for (const k of [-9999, -100, -1, 0, 1, 1234, 9999]) {
    const { index } = hash(k, { method }); assert.ok(index >= 0 && index < 11);
  }
});
test('invalid configuration and out-of-domain inputs are rejected', () => {
  for (const size of [1, 32, 2.5, NaN]) assert.throws(() => new Table({ size }));
  for (const strategy of ['double', 'quadratic']) assert.throws(() => new Table({ strategy, size: 12 }));
  for (const key of [-10000, 10000, NaN, 1.5]) assert.throws(() => hash(key));
  for (const c of [{method:'unknown'}, {strategy:'unknown'}]) assert.throws(() => new Table(c));
});
test('deletion leaves collision chains searchable; reinsertion avoids duplicate keys', () => {
  for (const strategy of strategies) {
    const t = new Table({ strategy });
    for (const k of [22, 33, 44]) assert.ok(t.operate('insert', k).success);
    assert.ok(t.operate('delete', 22).success);
    if (strategy !== 'chaining') assert.equal(t.slots[0], DELETED);
    assert.ok(t.operate('find', 44).success);
    t.operate('insert', 44); assert.equal(t.count, 2);
    t.operate('insert', 55); assert.equal(t.count, 3);
    assert.equal(t.operate('find', 22).success, false);
  }
});
test('quadratic probing reports exhausted subset without calling the entire table full', () => {
  const t = new Table({ strategy: 'quadratic', size: 7 });
  for (const k of [0, 7, 14, 21]) assert.ok(t.operate('insert', k).success);
  const result = t.operate('insert', 28);
  assert.equal(result.success, false); assert.match(result.message, /other slots may be empty/);
  t.operate('delete', 14); assert.ok(t.operate('insert', 28).success);
});
test('all methods and strategies agree with set semantics over mixed operations', () => {
  for (const method of methods) for (const strategy of strategies) {
    const t = new Table({ method, strategy }), expected = new Set();
    let seed = 71;
    for (let i = 0; i < 250; i++) {
      seed = (seed * 48271) % 2147483647;
      const key = seed % 29 - 14, action = ['insert', 'find', 'delete'][seed % 3];
      const before = t.snapshot(), result = t.operate(action, key);
      if (action === 'insert') { if (result.success) expected.add(key); }
      else { assert.equal(result.success, expected.has(key)); if (action === 'delete') expected.delete(key); }
      assert.equal(t.count, expected.size);
      for (const k of expected) assert.ok(t.operate('find', k).success);
      if (action === 'find') assert.deepEqual(t.snapshot(), before);
    }
  }
});
test('trace snapshots do not change after subsequent mutations', () => {
  for (const strategy of strategies) {
    const t = new Table({ strategy });
    const steps = t.operate('insert', 22).steps, saved = JSON.stringify(steps);
    t.operate('insert', 33); t.operate('delete', 22);
    assert.equal(JSON.stringify(steps), saved);
  }
});

test('rehash preserves all live keys and removes tombstones for every strategy', () => {
  for (const method of methods) for (const strategy of strategies) {
    const t = new Table({ method, strategy });
    for (const k of [0, 11, 22, -1]) assert.ok(t.operate('insert', k).success);
    t.operate('delete', 11);
    const result = t.rehash(23);
    assert.equal(t.config.size, 23); assert.equal(t.count, 3);
    assert.equal(t.snapshot().includes(DELETED), false);
    for (const k of [0, 22, -1]) assert.ok(t.operate('find', k).success);
    assert.equal(t.operate('find', 11).success, false);
    assert.equal(result.steps[0].count, 0);
    assert.match(result.steps.at(-1).message, /Rehash complete/);
  }
});
test('failed resize leaves the original table and configuration unchanged', () => {
  for (const strategy of ['linear', 'quadratic', 'double']) {
    const t = new Table({strategy});
    for (const k of [0, 1, 2, 3]) t.operate('insert', k);
    const before = t.snapshot();
    assert.throws(() => t.rehash(2), /Original table preserved/);
    assert.deepEqual(t.snapshot(), before); assert.equal(t.config.size, 11);
    assert.throws(() => t.rehash(0));
  }
});
