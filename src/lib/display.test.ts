import { describe, expect, it } from 'vitest';
import { hoursRange, hoursWhole, moneyCompact, moneyRange } from './display';

describe('display formats (design rule 7)', () => {
  it('hours ranges are whole numbers', () => {
    expect(hoursRange(11.235, 16.05)).toBe('11–16');
    expect(hoursRange(7, 10)).toBe('7–10');
    expect(hoursRange(0.2, 0.4)).toBe('0');
    expect(hoursWhole(890.1)).toBe('890');
    expect(hoursWhole(1234.6)).toBe('1,235');
  });

  it('money is compact, matching the brief: $9.7K–$13.8K and $116K–$166K', () => {
    expect(moneyRange(9_662, 13_803)).toBe('$9.7K–$13.8K');
    expect(moneyRange(115_945, 165_636)).toBe('$116K–$166K');
  });

  it.each([
    [0, '$0'],
    [940, '$940'],
    [999.4, '$999'],
    [1_000, '$1K'],
    [3_010, '$3K'],
    [10_385, '$10.4K'],
    [99_940, '$99.9K'],
    [99_960, '$100K'],
    [178_020, '$178K'],
    [999_400, '$999K'],
    [999_600, '$1M'],
    [1_234_567, '$1.2M'],
    [12_600_000, '$13M'],
    [-39_000, '-$39K'],
  ])('moneyCompact(%d) = %s', (n, s) => {
    expect(moneyCompact(n)).toBe(s);
  });

  it('never prints NaN, Infinity or long figures', () => {
    for (const v of [Number.NaN, Number.POSITIVE_INFINITY, -0]) {
      expect(moneyCompact(v)).toBe('$0');
      expect(hoursRange(v, v)).toBe('0');
    }
    for (let v = 0; v < 50_000_000; v = v * 1.37 + 7) expect(moneyCompact(v).length).toBeLessThanOrEqual(7);
  });
});
