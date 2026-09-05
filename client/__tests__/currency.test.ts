import { formatAmountInput, normalizeAmountEdit, normalizeAmountInput } from '../src/lib/currency';

describe('currency input', () => {
  it('uses a dollar prefix and space when the amount is empty', () => {
    expect(formatAmountInput('')).toBe('$ ');
  });

  it('formats an amount with a dollar prefix, thousands separators, and cents', () => {
    expect(formatAmountInput('123123')).toBe('$ 123,123.00');
  });

  it('keeps the decimal place when the formatted decimal separator is deleted', () => {
    expect(normalizeAmountEdit('$ 1,23300', '1233')).toBe('1233');
    expect(formatAmountInput(normalizeAmountEdit('$ 1,23300', '1233'))).toBe('$ 1,233.00');
  });

  it('clears fractional digits without adding them to the integer amount', () => {
    expect(normalizeAmountEdit('$ 1,233', '1233.45')).toBe('1233');
  });

  it('normalizes leading decimals without leaving a blank whole number', () => {
    expect(normalizeAmountInput('.5')).toBe('0.5');
    expect(formatAmountInput('.5')).toBe('$ 0.50');
  });
});
