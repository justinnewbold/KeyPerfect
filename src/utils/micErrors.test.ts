import { describe, it, expect } from 'vitest';
import { describeMicError } from './micErrors';

describe('describeMicError', () => {
  const cases: [string, RegExp][] = [
    ['NotAllowedError', /blocked/i],
    ['SecurityError', /blocked/i],
    ['NotFoundError', /no microphone/i],
    ['OverconstrainedError', /no microphone/i],
    ['NotReadableError', /in use/i],
  ];

  for (const [name, expected] of cases) {
    it(`names the ${name} case`, () => {
      const copy = describeMicError(Object.assign(new Error('x'), { name }));
      expect(copy.title).toMatch(expected);
      // Every case has to say what to do next, not just what went wrong.
      expect(copy.detail.length).toBeGreaterThan(20);
    });
  }

  it('falls back safely for unknown and malformed rejections', () => {
    for (const value of [null, undefined, 'a string', new Error('boom'), {}]) {
      const copy = describeMicError(value);
      expect(copy.title).toBeTruthy();
      expect(copy.detail).toBeTruthy();
    }
  });
});
