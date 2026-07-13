export interface InvoiceFormData {
  date: string;
  billNumber: string;
  state: string;
  stateCode: string;
  receiverName: string;
  receiverAddress: string;
  receiverGSTIN: string;
  invoiceNumber: string;
  billNo: string;
  dispatchedThrough: string;
  customTransport: string;
  billOfLading: string;
  destination: string;
  rows: InvoiceRow[];
  deliveryDate: string;
  lorryNumber: string;
  paymentMade?: number | string | null;
  pendingAmount?: number | null;
}

/**
 * Convert a number to words in Indian numbering system
 * Example: 682068 -> "Six Lakhs Eighty Two Thousand Sixty Eight Only"
 */
export function numberToWords(num: number | string): string {
  const number = typeof num === 'string' ? parseInt(num, 10) : num;

  if (number === 0) return 'Zero Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const scales = [
    { value: 10000000, name: 'Crore' },
    { value: 100000, name: 'Lakh' },
    { value: 1000, name: 'Thousand' },
    { value: 100, name: 'Hundred' },
  ];

  function convertHundreds(n: number): string {
    if (n === 0) return '';

    let result = '';

    const hundred = Math.floor(n / 100);
    if (hundred > 0) {
      result += ones[hundred] + ' Hundred ';
    }

    const remainder = n % 100;
    if (remainder >= 20) {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      result += tens[ten];
      if (one > 0) {
        result += ' ' + ones[one];
      }
    } else if (remainder >= 10) {
      result += teens[remainder - 10];
    } else if (remainder > 0) {
      result += ones[remainder];
    }

    return result.trim() + ' ';
  }

  let result = '';
  let isFirst = true;

  for (const scale of scales) {
    if (number >= scale.value) {
      const quotient = Math.floor(number / scale.value);
      result += convertHundreds(quotient) + scale.name + ' ';
      const n = number % scale.value;
      return (
        result +
        numberToWords(n)
          .replace(' Only', '')
          .trim() +
        ' Only'
      );
    }
  }

  result = convertHundreds(number).trim();
  return result + ' Only';
}

/**
 * Format currency with Indian numbering system
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Calculate invoice total
 */
export function calculateTotal(rows: InvoiceRow[]): number {
  return rows.reduce((sum, row) => sum + (row.amount || 0), 0);
}

/**
 * Invoice row type
 */
export interface InvoiceRow {
  id: string;
  description: string;
  customDescription?: string;
  quantity: number;
  rate: number;
  amount: number;
}

/**
 * Calculate amount for a row
 */
export function calculateAmount(quantity: number, rate: number): number {
  return quantity * rate;
}
