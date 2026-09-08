(function (root) {
  'use strict';
  function integer(raw) {
    if (!/^[+-]?\d+$/.test(String(raw).trim())) throw new Error('Enter whole numbers only.');
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || Math.abs(n) > 9999) throw new Error('Use integers from -9999 to 9999.');
    return n;
  }
  function parseList(raw) {
    if (!String(raw).trim()) throw new Error('Enter at least one number.');
    const tokens = String(raw).trim().split(/[\s,]+/);
    if (tokens.length > 12) throw new Error('Use at most 12 numbers so every cell stays readable.');
    return tokens.map(integer);
  }
  function search(kind, values, target) {
    if (kind !== 'linear' && values.some((v, i) => i && v < values[i - 1])) {
      throw new Error('Enter the array in ascending order. Values are not sorted automatically.');
    }
    const steps = [];
    let low = 0, high = values.length - 1;
    while (low <= high) {
      if (kind === 'interpolation' && (target < values[low] || target > values[high])) break;
      let pos = low;
      if (kind === 'binary') pos = low + Math.floor((high - low) / 2);
      if (kind === 'interpolation' && values[high] !== values[low]) {
        pos = low + Math.floor((target - values[low]) * (high - low) / (values[high] - values[low]));
        pos = Math.max(low, Math.min(high, pos));
      }
      const found = values[pos] === target;
      steps.push({ low, high, pos, found, message: `low = ${low} · index = ${pos} · high = ${high}: ${values[pos]} ${found ? '=' : '≠'} ${target}` });
      if (found) return { steps, message: `Found ${target} at index ${pos} after ${steps.length} comparison(s).`, index: pos };
      if (kind === 'linear' || values[pos] < target) low = pos + 1;
      else high = pos - 1;
    }
    return { steps, message: `${target} was not found. Return -1 (${steps.length} comparison(s)).`, index: -1 };
  }
  function probing(keys, size) {
    if (!Number.isInteger(size) || size < 2 || size > 13) throw new Error('Table size must be an integer from 2 to 13.');
    const slots = Array(size).fill(null), steps = [];
    for (const key of keys) {
      const home = ((key % size) + size) % size;
      let placed = false;
      for (let offset = 0; offset < size; offset++) {
        const pos = (home + offset) % size;
        if (slots[pos] === key) {
          steps.push({ pos, slots: [...slots], message: `${key} already exists at index ${pos}; duplicate skipped.` });
          placed = true; break;
        }
        if (slots[pos] === null) {
          slots[pos] = key;
          steps.push({ pos, slots: [...slots], message: `h(${key}) = ${home}. Insert ${key} at index ${pos}.` });
          placed = true; break;
        }
        steps.push({ pos, slots: [...slots], message: `h(${key}) = ${home}. Index ${pos} is occupied; probe the next slot.` });
      }
      if (!placed) steps.push({ pos: -1, slots: [...slots], message: `Table full: cannot insert ${key}.` });
    }
    return { steps, slots };
  }
  root.DSADemo = { integer, parseList, search, probing };
})(globalThis);
