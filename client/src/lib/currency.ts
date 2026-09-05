export function formatAmount(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function normalizeAmountInput(value: string): string {
  const [whole = '', ...fractionParts] = value.replace(/[^\d.]/g, '').split('.');
  return fractionParts.length ? `${whole || '0'}.${fractionParts.join('').slice(0, 2)}` : whole;
}

export function normalizeAmountEdit(value: string, previousValue: string): string {
  const previousFormatted = formatAmountInput(previousValue);
  const decimalIndex = previousFormatted.indexOf('.');
  const previousInteger = previousValue.split('.')[0];

  if (
    decimalIndex >= 0
    && (value === previousFormatted.slice(0, decimalIndex) || value === previousFormatted.replace('.', ''))
  ) {
    return previousInteger;
  }

  return normalizeAmountInput(value);
}

export function formatAmountInput(value: string): string {
  const [whole = '', fraction = ''] = value.split('.');
  if (!whole && !fraction) return '$ ';

  const formattedWhole = whole ? Number(whole).toLocaleString('en-US') : '';
  return `$ ${formattedWhole}.${fraction.padEnd(2, '0')}`;
}

export function integerCursorPosition(formattedValue: string, digitsBeforeCursor: number): number {
  if (!digitsBeforeCursor) return 2;

  let digitsFound = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) digitsFound += 1;
    if (digitsFound === digitsBeforeCursor) return index + 1;
  }

  return formattedValue.indexOf('.');
}
