/**
 * San Marino — tax identifiers (OECD TIN sheet).
 *
 * SM_SSI — individuals: the 9-digit social security number (ISS) also
 *   serves as the TIN. No published check digit; shape only.
 * SM_COE — entities: Codice Operatore Economico, `SM` + 5 digits. Shape only.
 *
 * The OECD sheet says the leading digits "might be omitted if they correspond
 * to the digit zero". The sheet states it on the individuals' row; python-stdnum's
 * COE documentation says the same for the COE, so both `normalize` functions
 * left-pad shorter forms (9 digits / `SM` + 5 digits). `lengths` and `pattern`
 * are checked after normalize and stay at the full length.
 *
 * Both are shape-only, so identify() skips them when guessing a country.
 * Ported from idnumbers; its composite validator is split into two documents
 * so callers know which one matched.
 *
 * Improves on upstream:
 * - Accepts the shorter forms with leading zeros omitted (idnumbers rejects them).
 */
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const SOURCES = [
  "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/san-marino-tin.pdf",
  "https://www.iss.sm/",
];

/**
 * Restore omitted leading zeros of the 9-digit SSI. The sheet's format is
 * "more than one digit", so only 2-8 digit inputs that aren't all zeros are
 * padded; anything else is left for the length check to reject.
 */
export function normalizeSsi(input: string): string {
  const d = digitsOnly(input);
  return /^(?!0+$)\d{2,8}$/.test(d) ? d.padStart(9, "0") : d;
}

/** Restore omitted leading zeros of the COE's 5 digits (`SM12` → `SM00012`); all zeros aren't padded. */
export function normalizeCoe(input: string): string {
  const c = compact(input);
  return /^SM(?!0+$)\d{1,4}$/.test(c) ? "SM" + c.slice(2).padStart(5, "0") : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "SM_SSI",
    country: "SM",
    name: "San Marino Social Security Number",
    localName: "Codice ISS",
    aliases: ["SSI", "ISS number", "TIN"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: normalizeSsi,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
  {
    code: "SM_COE",
    country: "SM",
    name: "San Marino Economic Operator Code",
    localName: "Codice Operatore Economico",
    aliases: ["COE", "VAT number", "TIN"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "low",
    lengths: [7],
    pattern: /^SM\d{5}$/,
    example: "SM12345",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: normalizeCoe,
    parse: (id) => ({ ok: true, data: { serial: id.slice(2), extra: {} } }),
  },
];
