const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? '';
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (TENS[tens] ?? '') + (ones ? ' ' + (ONES[ones] ?? '') : '');
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return (hundreds ? ONES[hundreds] + ' Hundred' + (rest ? ' ' : '') : '') + (rest ? twoDigits(rest) : '');
}

/** Converts a non-negative integer to words using the Nepali numbering scale (lakh/crore). */
function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(threeDigits(crore) + ' Crore');
  if (lakh) parts.push(threeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigits(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ');
}

/** e.g. 1130.5 -> "Rupees One Thousand One Hundred Thirty and Paisa Fifty Only" */
export function amountInWordsNpr(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paisa = Math.round((Math.abs(amount) - rupees) * 100);
  const rupeeWords = integerToWords(rupees);
  const paisaWords = paisa > 0 ? ` and Paisa ${twoDigits(paisa)}` : '';
  return `Rupees ${rupeeWords}${paisaWords} Only`;
}
