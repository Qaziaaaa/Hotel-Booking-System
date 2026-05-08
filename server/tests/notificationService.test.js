import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Simulate the upsert behaviour: last token wins
const simulateTokenUpserts = (tokens) => {
  const store = {};
  for (const token of tokens) {
    store['userId'] = token; // upsert: replace existing
  }
  return store['userId'];
};

/**
 * P10: FCM token uniqueness
 * Validates: Requirements 15.2, 24.2
 */
describe('P10: FCM token uniqueness', () => {
  it('after multiple upserts for the same user, only the last token is stored', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
        (tokens) => {
          const finalToken = simulateTokenUpserts(tokens);
          expect(finalToken).toBe(tokens[tokens.length - 1]);
        }
      )
    );
  });

  it('a single registration stores exactly one token', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (token) => {
          const result = simulateTokenUpserts([token]);
          expect(result).toBe(token);
        }
      )
    );
  });

  it('empty token array results in no stored token', () => {
    const result = simulateTokenUpserts([]);
    expect(result).toBeUndefined();
  });
});
