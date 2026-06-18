/**
 * Feature 1: Identifies the Cameroonian mobile operator from a +237 number.
 * MTN prefixes : 650-654, 670-679, 680-689
 * Orange prefixes: 655-659, 690-699
 * Returns 'mtn' | 'orange' | null
 */
export function detectOperator(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return null; // 237 + 8 digits
  const prefix = parseInt(digits.slice(3, 6), 10); // e.g. 677 → 677
  if ((prefix >= 650 && prefix <= 654) || (prefix >= 670 && prefix <= 689)) return 'mtn';
  if ((prefix >= 655 && prefix <= 659) || (prefix >= 690 && prefix <= 699)) return 'orange';
  return null;
}

/**
 * Validates Cameroonian phone: +237 6[5-9]X XXX XXX
 */
export function isValidCamPhone(phone) {
  return /^\+2376[5-9]\d{7}$/.test(phone.replace(/\s/g, ''));
}
