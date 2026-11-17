/**
 * Input clean-up shared by every document module.
 *
 * Only ASCII letters are uppercased: a lookalike such as the long s (ſ) or the
 * dotless i (ı) would otherwise become S / I and pass a validator.
 */

/** Whitespace incl. NBSP, zero-width chars, BOM and C0/C1 controls. */
const INVISIBLE = /[\s ​-‍⁠﻿\u0000-\u001f\u007f-\u009f]/g;
/** Hyphen lookalikes people paste from Word/PDF. */
const DASHES = /[‐-―−﹘﹣－]/g;

export function upperAscii(s: string): string {
  return s.replace(/[a-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 32));
}

/** Full-width digits/letters (common from East-Asian keyboards) to ASCII. */
export function toHalfWidth(s: string): string {
  return s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/** Trim, unify dashes, half-width, uppercase ASCII. Keeps separators. */
export function clean(input: string): string {
  return upperAscii(toHalfWidth(input).replace(DASHES, "-")).trim();
}

/** Default normalisation: `clean` then drop whitespace and the separators `. - / ( ) ,`. */
export function compact(input: string): string {
  return clean(input).replace(INVISIBLE, "").replace(/[.\-/(),_:]/g, "");
}

/** `compact` but keeps the characters in `keep` (e.g. Finland's century sign `-`/`+`). */
export function compactKeeping(input: string, keep: string): string {
  const drop = [".", "-", "/", "(", ")", ",", "_", ":"].filter((c) => !keep.includes(c));
  const re = new RegExp(`[${drop.map((c) => "\\" + c).join("")}]`, "g");
  return clean(input).replace(INVISIBLE, "").replace(re, "");
}

export function digitsOnly(input: string): string {
  return toHalfWidth(input).replace(/\D/g, "");
}

/** Insert separators: `group("8001015009087", [6, 4, 3], " ")` -> "800101 5009 087". */
export function group(s: string, sizes: readonly number[], sep: string | readonly string[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const n of sizes) {
    if (i >= s.length) break;
    parts.push(s.slice(i, i + n));
    i += n;
  }
  if (i < s.length) parts.push(s.slice(i));
  if (typeof sep === "string") return parts.join(sep);
  return parts.reduce((acc, p, k) => (k === 0 ? p : acc + (sep[k - 1] ?? "") + p), "");
}
