/**
 * Check-digit algorithms shared by document modules.
 *
 * Functions that compute a check digit return `undefined` for invalid input
 * instead of throwing, so modules can map that straight to `invalid_format`.
 * Ported in part from nationid (MIT, (c) 2026 Luis Navarro) and idnumbers
 * (MIT, (c) 2024 Identique); see THIRD_PARTY_NOTICES.md.
 */

export const digit = (s: string, i: number): number => s.charCodeAt(i) - 48;

export const isDigits = (s: string): boolean => /^\d+$/.test(s);

/** Value of 0-9 → 0-9, A-Z → 10-35. -1 otherwise. */
export function alnumValue(ch: string): number {
  const c = ch.charCodeAt(0);
  if (c >= 48 && c <= 57) return c - 48;
  if (c >= 65 && c <= 90) return c - 55;
  return -1;
}

/** Σ digit[i] * weights[i] over the first `weights.length` digits (or all of `s` if shorter). */
export function weightedSum(s: string, weights: readonly number[]): number {
  let sum = 0;
  const n = Math.min(s.length, weights.length);
  for (let i = 0; i < n; i++) sum += digit(s, i) * (weights[i] as number);
  return sum;
}

// --- Luhn (mod 10) ---------------------------------------------------------

/** Luhn check digit for `body` (the number without its check digit). */
export function luhnCheckDigit(body: string): number | undefined {
  if (!isDigits(body)) return undefined;
  let sum = 0;
  let double = true;
  for (let i = body.length - 1; i >= 0; i--) {
    let d = digit(body, i);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

/** Full number (check digit last) passes Luhn. */
export function luhnValid(full: string): boolean {
  if (full.length < 2 || !isDigits(full)) return false;
  return luhnCheckDigit(full.slice(0, -1)) === digit(full, full.length - 1);
}

// --- Verhoeff --------------------------------------------------------------

const V_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const V_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const V_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffValid(full: string): boolean {
  if (full.length < 2 || !isDigits(full)) return false;
  let c = 0;
  for (let i = 0; i < full.length; i++) {
    c = V_D[c]![V_P[i % 8]![digit(full, full.length - 1 - i)]!]!;
  }
  return c === 0;
}

export function verhoeffCheckDigit(body: string): number | undefined {
  if (!isDigits(body)) return undefined;
  let c = 0;
  for (let i = 0; i < body.length; i++) {
    c = V_D[c]![V_P[(i + 1) % 8]![digit(body, body.length - 1 - i)]!]!;
  }
  return V_INV[c];
}

// --- Damm ------------------------------------------------------------------

const DAMM = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
];

export function dammValid(full: string): boolean {
  if (full.length < 2 || !isDigits(full)) return false;
  let i = 0;
  for (let k = 0; k < full.length; k++) i = DAMM[i]![digit(full, k)]!;
  return i === 0;
}

// --- ISO/IEC 7064 ----------------------------------------------------------

/**
 * ISO 7064 hybrid system MOD (M+1, M): MOD 11,10 for digits, MOD 37,36 for
 * alphanumerics. Returns the check value 0..M-1 for `body`.
 */
export function iso7064HybridCheck(body: string, modulus: 10 | 36): number | undefined {
  let p = modulus;
  for (const ch of body) {
    const v = alnumValue(ch);
    if (v < 0 || v >= modulus) return undefined;
    let s = (p + v) % modulus;
    if (s === 0) s = modulus;
    p = (s * 2) % (modulus + 1);
  }
  return (modulus + 1 - p) % modulus;
}

export function mod11_10Valid(full: string): boolean {
  if (full.length < 2 || !isDigits(full)) return false;
  return iso7064HybridCheck(full.slice(0, -1), 10) === digit(full, full.length - 1);
}

/**
 * ISO 7064 MOD 11-2 (pure). Check value 0..10 where 10 is written `X`.
 * Used by China's resident ID and ISNI/ORCID.
 */
export function mod11_2Check(body: string): string | undefined {
  if (!isDigits(body)) return undefined;
  let p = 0;
  for (let i = 0; i < body.length; i++) p = ((p + digit(body, i)) * 2) % 11;
  const c = (12 - p) % 11;
  return c === 10 ? "X" : String(c);
}

/** ISO 7064 MOD 97-10: valid when the whole number (letters as 10..35) mod 97 is 1. */
export function mod97(s: string): number | undefined {
  let rem = 0;
  for (const ch of s) {
    const v = alnumValue(ch);
    if (v < 0) return undefined;
    const chunk = v < 10 ? String(v) : String(v);
    for (const c of chunk) rem = (rem * 10 + (c.charCodeAt(0) - 48)) % 97;
  }
  return rem;
}

// --- mod 11 helpers ----------------------------------------------------------

/**
 * Classic "11 - (Σ w·d mod 11)" check digit. Returns 0..10; callers decide
 * how 10 (and 11 → 0) is handled since countries differ.
 */
export function mod11Complement(body: string, weights: readonly number[]): number {
  return (11 - (weightedSum(body, weights) % 11)) % 11;
}

/** Weights 2,3,4,5,6,7,2,3,... from the right (Brazil, Chile, many others). */
export function cyclicWeightsFromRight(length: number, from = 2, to = 7): number[] {
  const out = new Array<number>(length);
  let w = from;
  for (let i = length - 1; i >= 0; i--) {
    out[i] = w;
    w = w === to ? from : w + 1;
  }
  return out;
}

// --- ICAO 9303 (passports / MRZ) ---------------------------------------------

/** MRZ character value: 0-9, A-Z → 10-35, `<` → 0. */
export function mrzValue(ch: string): number {
  if (ch === "<") return 0;
  return alnumValue(ch);
}

/** ICAO 9303 check digit (weights 7,3,1). */
export function icaoCheckDigit(s: string): number | undefined {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const v = mrzValue(s[i] as string);
    if (v < 0) return undefined;
    sum += v * (w[i % 3] as number);
  }
  return sum % 10;
}
