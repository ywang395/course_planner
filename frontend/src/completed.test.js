import { describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEY,
  addCompleted,
  collectKnownCodes,
  getStorage,
  loadCompleted,
  normalizeCode,
  removeCompleted,
  saveCompleted,
  sortCodes,
  toggleCompleted,
  validateCode,
  impliedCompleted,
} from './completed.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
  };
}

describe('normalizeCode', () => {
  it('trims, collapses whitespace and uppercases', () => {
    expect(normalizeCode('  cs   46a ')).toBe('CS 46A');
  });
  it('returns an empty string for blank or missing input', () => {
    expect(normalizeCode('   ')).toBe('');
    expect(normalizeCode(undefined)).toBe('');
    expect(normalizeCode(null)).toBe('');
  });
});

describe('validateCode', () => {
  it('accepts normal and suffixed codes', () => {
    expect(validateCode('math 19')).toBe('');
    expect(validateCode('CS 157A')).toBe('');
    expect(validateCode('CMPE 102')).toBe('');
  });
  it('rejects blank input', () => {
    expect(validateCode('  ')).toMatch(/Enter a course code/);
  });
  it('rejects codes without a space between subject and number', () => {
    expect(validateCode('CS146')).toMatch(/doesn't look like a course code/);
  });
  it('rejects codes that are already completed', () => {
    expect(validateCode('cs 46a', ['CS 46A'])).toBe('CS 46A is already marked as completed.');
  });
});

describe('sortCodes', () => {
  it('sorts numerically within a subject without mutating the input', () => {
    const input = ['CS 146', 'MATH 19', 'CS 47', 'CS 46B', 'CS 46A'];
    expect(sortCodes(input)).toEqual(['CS 46A', 'CS 46B', 'CS 47', 'CS 146', 'MATH 19']);
    expect(input[0]).toBe('CS 146');
  });
});

describe('addCompleted / removeCompleted / toggleCompleted', () => {
  it('adds a normalized code in sorted order', () => {
    expect(addCompleted(['CS 146'], ' cs 47 ')).toEqual(['CS 47', 'CS 146']);
  });
  it('returns the same array for duplicates and blanks', () => {
    const list = ['CS 47'];
    expect(addCompleted(list, 'cs 47')).toBe(list);
    expect(addCompleted(list, '  ')).toBe(list);
  });
  it('removes a code, ignoring case and spacing', () => {
    expect(removeCompleted(['CS 47', 'MATH 19'], 'math  19')).toEqual(['CS 47']);
  });
  it('returns the same array when removing a missing code', () => {
    const list = ['CS 47'];
    expect(removeCompleted(list, 'CS 146')).toBe(list);
  });
  it('toggles membership', () => {
    expect(toggleCompleted([], 'CS 46A')).toEqual(['CS 46A']);
    expect(toggleCompleted(['CS 46A'], 'cs 46a')).toEqual([]);
  });
});

describe('collectKnownCodes', () => {
  it('includes catalog codes and off-catalog prerequisite references, deduplicated', () => {
    const courses = [
      { code: 'CS 146', prerequisites: ['MATH 30', 'CS 46B', 'CS 49J'] },
      { code: 'CS 157A', prerequisites: ['CS 146'] },
      { code: 'CS 46B', prerequisites: null },
    ];
    expect(collectKnownCodes(courses)).toEqual(['CS 46B', 'CS 49J', 'CS 146', 'CS 157A', 'MATH 30']);
  });
  it('handles an empty or missing list', () => {
    expect(collectKnownCodes()).toEqual([]);
  });
});

describe('getStorage', () => {
  it('returns localStorage when available', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(getStorage()).toBe(storage);
    vi.unstubAllGlobals();
  });
  it('returns null when accessing localStorage throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      expect(getStorage()).toBeNull();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else delete globalThis.localStorage;
    }
  });
});

describe('loadCompleted', () => {
  it('loads, normalizes, dedupes and sorts saved codes', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(['cs 146', 'CS 47', 'CS 146', 42]) });
    expect(loadCompleted(storage)).toEqual(['CS 47', 'CS 146']);
  });
  it('returns [] when nothing is saved, storage is missing, JSON is invalid or not an array', () => {
    expect(loadCompleted(memoryStorage())).toEqual([]);
    expect(loadCompleted(null)).toEqual([]);
    expect(loadCompleted(memoryStorage({ [STORAGE_KEY]: '{oops' }))).toEqual([]);
    expect(loadCompleted(memoryStorage({ [STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
  });
  it('returns [] when getItem throws', () => {
    expect(loadCompleted({ getItem() { throw new Error('denied'); } })).toEqual([]);
  });
});

describe('saveCompleted', () => {
  it('saves the list as JSON and returns true', () => {
    const storage = memoryStorage();
    expect(saveCompleted(['CS 47'], storage)).toBe(true);
    expect(storage.data[STORAGE_KEY]).toBe('["CS 47"]');
  });
  it('removes the key when the list is empty', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '["CS 47"]' });
    expect(saveCompleted([], storage)).toBe(true);
    expect(STORAGE_KEY in storage.data).toBe(false);
  });
  it('returns false when storage is missing or throws (e.g. quota exceeded)', () => {
    expect(saveCompleted(['CS 47'], null)).toBe(false);
    expect(saveCompleted(['CS 47'], { setItem() { throw new Error('QuotaExceededError'); } })).toBe(false);
  });
  it('round-trips with loadCompleted', () => {
    const storage = memoryStorage();
    saveCompleted(['CS 46A', 'MATH 19'], storage);
    expect(loadCompleted(storage)).toEqual(['CS 46A', 'MATH 19']);
  });
});

describe('impliedCompleted', () => {
  const courses = [
    { code: 'CS 46A', prerequisites: ['MATH 1'] },
    { code: 'CS 46B', prerequisites: ['CS 46A', 'MATH 19'] },
    { code: 'CS 146', prerequisites: ['MATH 42', 'CS 46B'] },
    { code: 'MATH 42', prerequisites: ['MATH 19'] },
    { code: 'CS 149', prerequisites: ['CS 146'] },
    { code: 'LOOP 1', prerequisites: ['LOOP 2'] },
    { code: 'LOOP 2', prerequisites: ['LOOP 1'] },
  ];

  it('covers prerequisites transitively, including off-catalog codes', () => {
    expect(impliedCompleted(['CS 146'], courses)).toEqual([
      { code: 'CS 46A', via: 'CS 146' },
      { code: 'CS 46B', via: 'CS 146' },
      { code: 'MATH 1', via: 'CS 146' },
      { code: 'MATH 19', via: 'CS 146' },
      { code: 'MATH 42', via: 'CS 146' },
    ]);
  });

  it('does not repeat explicitly completed codes and credits the first covering class', () => {
    const result = impliedCompleted(['CS 149', 'CS 46B'], courses);
    expect(result.map((entry) => entry.code)).not.toContain('CS 46B');
    // Roots are visited in natural order, so CS 46B (before CS 149) covers CS 46A.
    expect(result).toContainEqual({ code: 'CS 46A', via: 'CS 46B' });
    expect(result).toContainEqual({ code: 'CS 146', via: 'CS 149' });
  });

  it('normalizes input, ignores unknown classes, and survives cycles', () => {
    expect(impliedCompleted([' cs  46a '], courses)).toEqual([{ code: 'MATH 1', via: 'CS 46A' }]);
    expect(impliedCompleted(['NOPE 1'], courses)).toEqual([]);
    expect(impliedCompleted(['LOOP 1'], courses)).toEqual([{ code: 'LOOP 2', via: 'LOOP 1' }]);
    expect(impliedCompleted([], courses)).toEqual([]);
  });
});
