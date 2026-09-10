(function (root) {
  'use strict';
  const mod = (k, m) => ((k % m) + m) % m;
  const prime = n => Number.isInteger(n) && n >= 2 && !Array.from({ length: Math.max(0, Math.floor(Math.sqrt(n)) - 1) }, (_, i) => i + 2).some(d => n % d === 0);
  const methods = ['division', 'mid-square', 'multiplication'];
  const strategies = ['chaining', 'linear', 'quadratic', 'double'];
  const DELETED = 'deleted';
  function keyValue(k) {
    if (!Number.isInteger(k) || Math.abs(k) > 9999) throw new Error('Keys must be integers from -9999 to 9999.');
    return k;
  }
  function config(options = {}) {
    const c = { method: 'division', strategy: 'linear', size: 11, ...options };
    if (!methods.includes(c.method) || !strategies.includes(c.strategy)) throw new Error('Unknown hash method or collision strategy.');
    if (!Number.isInteger(c.size) || c.size < 2 || c.size > 31) throw new Error('Table size must be from 2 to 31.');
    if (['quadratic', 'double'].includes(c.strategy) && !prime(c.size)) throw new Error('Use a prime table size for quadratic probing or double hashing (e.g. 7, 11, 13, 17).');
    return c;
  }
  function hash(key, options = {}) {
    keyValue(key);
    const c = config(options), m = c.size;
    let raw, detail;
    if (c.method === 'division') {
      raw = mod(key, m); detail = `${key} mod ${m} = ${raw} (non-negative modulo)`;
    } else if (c.method === 'mid-square') {
      const square = String(key * key).padStart(8, '0');
      raw = Number(square.slice(3, 5)); detail = `${key}² = ${square}; fixed middle two digits = ${square.slice(3, 5)}; ${raw} mod ${m}`;
    } else if (c.method === 'multiplication') {
      const product = Math.abs(key) * 0.6180339887498949;
      raw = Math.floor(m * (product - Math.floor(product)));
      detail = `floor(${m} × frac(|${key}| × 0.6180339887498949)) = ${raw}`;

    }
    return { index: mod(raw, m), detail };
  }
  class Table {
    constructor(options) {
      this.config = config(options);
      this.slots = this.config.strategy === 'chaining' ? Array.from({ length: this.config.size }, () => []) : Array(this.config.size).fill(null);
      this.count = 0;
    }
    snapshot() { return this.slots.map(v => Array.isArray(v) ? [...v] : v); }
    rehash(size) {
      // Build separately so a failed resize leaves the original table unchanged.
      const candidate = new Table({ ...this.config, size });
      const keys = this.config.strategy === 'chaining'
        ? this.slots.flat() : this.slots.filter(v => v !== null && v !== DELETED);
      const steps = [{ pos: -1, slots: candidate.snapshot(), count: 0,
        message: `Rehash ${keys.length} live keys from ${this.config.size} to ${size} buckets. Recompute every home bucket; discard tombstones.` }];
      for (const key of keys) {
        const result = candidate.operate('insert', key);
        if (!result.success) throw new Error('Resize failed: the new probe sequence cannot hold all keys. Choose a larger size. Original table preserved.');
        steps.push(...result.steps);
      }
      this.config = candidate.config; this.slots = candidate.slots; this.count = candidate.count;
      steps.push({ pos: -1, slots: this.snapshot(), count: this.count, message: `Rehash complete. ${this.count} keys preserved; tombstones removed.` });
      return { steps, success: true };
    }
    operate(action, key) {
      keyValue(key);
      if (!['insert', 'find', 'delete'].includes(action)) throw new Error('Unknown operation.');
      const { size, strategy } = this.config;
      const home = hash(key, this.config), steps = [];
      const emit = (pos, message, found = false) => steps.push({ pos, message, found, slots: this.snapshot(), count: this.count });
      emit(home.index, `h(${key}) = ${home.index}. ${home.detail}`);
      if (strategy === 'chaining') {
        const bucket = this.slots[home.index];
        let at = -1;
        for (let j = 0; j < bucket.length; j++) {
          emit(home.index, `Compare ${key} with bucket entry ${bucket[j]}.`);
          if (bucket[j] === key) { at = j; break; }
        }
        if (action === 'insert' && at < 0) { bucket.push(key); this.count++; }
        if (action === 'delete' && at >= 0) { bucket.splice(at, 1); this.count--; }
        const message = action === 'insert' ? (at < 0 ? `Inserted ${key}.` : `${key} already exists; duplicate skipped.`) : (at < 0 ? `${key} not found.` : `${action === 'find' ? 'Found' : 'Deleted'} ${key}.`);
        emit(home.index, message, at >= 0 || action === 'insert');
        return { steps, message, success: at >= 0 || action === 'insert' };
      }
      const stride = strategy === 'double' ? 1 + mod(key, size - 1) : 1;
      let tombstone = -1;
      const insertAt = pos => { this.slots[pos] = key; this.count++; emit(pos, `Inserted ${key} at slot ${pos}.`, true); };
      for (let i = 0; i < size; i++) {
        const offset = strategy === 'quadratic' ? i * i : i * stride;
        const pos = (home.index + offset) % size, value = this.slots[pos];
        emit(pos, `Probe ${i}: (${home.index} + ${offset}) mod ${size} = ${pos}${strategy === 'double' ? `; h₂ = ${stride}` : ''}.`);
        if (value === key) {
          if (action === 'delete') { this.slots[pos] = DELETED; this.count--; }
          emit(pos, action === 'insert' ? `${key} already exists; duplicate skipped.` : `${action === 'find' ? 'Found' : 'Deleted'} ${key} at slot ${pos}.`, true);
          return { steps, message: steps.at(-1).message, success: true };
        }
        if (value === DELETED) {
          if (tombstone < 0) tombstone = pos;
          emit(pos, 'Tombstone: continue the probe sequence.');
        } else if (value === null) {
          if (action === 'insert') insertAt(tombstone >= 0 ? tombstone : pos);
          else emit(pos, `Empty slot: ${key} not found.`);
          return { steps, message: steps.at(-1).message, success: action === 'insert' };
        }
      }
      if (action === 'insert' && tombstone >= 0) insertAt(tombstone);
      else emit(-1, action === 'insert' ? (this.count === size ? 'Table full: insertion failed.' : 'Probe sequence exhausted: insertion failed although other slots may be empty.') : `${key} not found after exhausting the probe sequence.`);
      return { steps, message: steps.at(-1).message, success: action === 'insert' && tombstone >= 0 };
    }
  }
  root.DSAHash = { hash, Table, config, methods, strategies, DELETED };
})(globalThis);
