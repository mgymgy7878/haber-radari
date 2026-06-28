import { describe, it, expect } from 'vitest';

function calculateInvariantOk(
  totalScanned: number,
  candidateClusterCount: number,
  publishedCount: number,
  hiddenCount: number
): { invariantOk: boolean; invariantError: string | null } {
  let invariantOk = true;
  let invariantError: string | null = null;
  
  if (publishedCount + hiddenCount !== candidateClusterCount) {
     invariantOk = false;
     invariantError = 'Allocation mismatch';
  } else if (candidateClusterCount > totalScanned) {
     invariantOk = false;
     invariantError = 'Cluster count exceeds raw count';
  }

  return { invariantOk, invariantError };
}

describe('Stats SSOT Invariant Logic', () => {
  it('A) Stats invariant simple case', () => {
    const result = calculateInvariantOk(5, 3, 1, 2);
    expect(result.invariantOk).toBe(true);
  });

  it('B) No hidden double count', () => {
    const result = calculateInvariantOk(10, 5, 2, 3);
    expect(result.invariantOk).toBe(true);
  });

  it('C) Cluster count cannot exceed raw count', () => {
    const result = calculateInvariantOk(2, 3, 1, 2);
    expect(result.invariantOk).toBe(false);
    expect(result.invariantError).toBe('Cluster count exceeds raw count');
  });
});
