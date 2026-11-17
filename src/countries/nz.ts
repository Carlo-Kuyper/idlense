/**
 * New Zealand — IRD (tax) number, NHI (health) number, NZBN (business) and
 * driver licence. New Zealand has no national identity number.
 *
 * - IRD number: 8 or 9 digits (an 8-digit number is a 7-digit base + check;
 *   it's often written with a leading 0). Inland Revenue's Payroll
 *   Calculations & Business Rules Specification §6.1:
 *     1. must be 10,000,000-200,000,000 (issued or expected within 10 years).
 *        Inland Revenue raised the upper limit from 150,000,000 to
 *        200,000,000 in 2026 (ird.govt.nz news, 10 Feb 2026); specs before
 *        the 2026 edition, and validators built on them, use 150,000,000;
 *     2. base = number without check digit, padded to 8 digits;
 *     3. c = 11 − Σ base·(3,2,7,6,5,4,3,2) mod 11 (remainder 0 → c = 0);
 *     4. if c = 10, redo with weights 7,4,3,2,5,2,7,6; still 10 → invalid.
 *   Issued to individuals and entities.
 * - NHI number (HISO 10046): three letters (A-Z without I and O, A=1 … Z=24),
 *   then either
 *     old `LLLNNNC`: Σ v·(7,6,5,4,3,2) mod 11; remainder 0 is invalid,
 *       check = 11 − remainder, 10 written as 0;
 *     new `LLLNNLX` (live from 1 July 2026, issued only once the old series
 *       runs out; Te Whatu Ora): Σ v·(7,6,5,4,3,2) mod 23; remainder 0
 *       is invalid, check letter = the (23 − remainder)-th letter of the same
 *       24-letter alphabet. (Modulus 23 replaced 24 in HISO 10046:2023.)
 *   NHIs starting with Z are reserved for testing (`extra.test`).
 * - NZBN: a GS1 Global Location Number, 13 digits starting 94, GS1 mod-10 check.
 * - Driver licence: two letters + six digits (NZTA). No check digit.
 *
 * Improves on upstream:
 * - idnumbers IRD skips Inland Revenue's range check (< 10,000,000 or
 *   > 200,000,000 is invalid); we report it as `invalid_range`.
 * - idnumbers driver licence accepts any `\w{2}\d{6}` (digits and `_` in the
 *   letter part) or any 7-8 alphanumerics, and rejects trailing repeated
 *   digits (a DLP heuristic, not an NZTA rule). We follow NZTA's shape.
 * - Adds NHI and NZBN (no upstream counterpart).
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const IRD_W1 = [3, 2, 7, 6, 5, 4, 3, 2];
const IRD_W2 = [7, 4, 3, 2, 5, 2, 7, 6];

function irdCheck(base8: string, w: readonly number[]): number {
  const r = weightedSum(base8, w) % 11;
  return r === 0 ? 0 : 11 - r;
}

export function irdCheckDigit(base8: string): number | undefined {
  const c = irdCheck(base8, IRD_W1);
  if (c !== 10) return c;
  const c2 = irdCheck(base8, IRD_W2);
  return c2 === 10 ? undefined : c2;
}

/** A-Z without I and O → 1..24. */
const NHI_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const nhiValue = (ch: string) => (/\d/.test(ch) ? Number(ch) : NHI_ALPHABET.indexOf(ch) + 1);

/** Expected 7th character of an NHI, or undefined when the first six can't carry one. */
export function nhiCheckChar(first6: string): string | undefined {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += nhiValue(first6[i]!) * (7 - i);
  if (/\d/.test(first6[5]!)) {
    const r = sum % 11;
    if (r === 0) return undefined;
    return String((11 - r) % 10);
  }
  const r = sum % 23;
  if (r === 0) return undefined;
  return NHI_ALPHABET[23 - r - 1];
}

/** GS1 mod-10 check digit over the body (weights 3,1,3,... from the right). */
export function gs1CheckDigit(body: string): number {
  let sum = 0;
  for (let i = body.length - 1, w = 3; i >= 0; i--, w = 4 - w) sum += Number(body[i]) * w;
  return (10 - (sum % 10)) % 10;
}

const bad = (reason: "invalid_checksum" | "invalid_range"): ParseOutcome => ({ ok: false, reason });

export const documents: DocumentSpec[] = [
  {
    code: "NZ_IRD",
    country: "NZ",
    name: "New Zealand IRD Number",
    localName: "Inland Revenue Department number",
    aliases: ["IRD", "IRD number", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [8, 9],
    pattern: /^\d{8,9}$/,
    example: "49091850",
    sources: [
      "https://www.ird.govt.nz/updates/news-folder/2026/increase-to-ird-number-validation-upper-limit",
      "https://www.ramco.com/hubfs/compliance-portal/payroll-calculations-and-business-rules-specification-2026-v8.pdf",
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/new-zealand-tin.pdf",
      "https://www.ird.govt.nz/managing-my-tax/ird-numbers",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => (c.length === 8 ? group(c, [2, 3, 3], "-") : group(c, [3, 3, 3], "-")),
    parse(id) {
      const n = Number(id);
      if (n < 10_000_000 || n > 200_000_000) return bad("invalid_range");
      const base = id.slice(0, -1).padStart(8, "0");
      if (irdCheckDigit(base) !== Number(id[id.length - 1])) return bad("invalid_checksum");
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "NZ_NHI",
    country: "NZ",
    name: "New Zealand National Health Index Number",
    aliases: ["NHI", "NHI number"],
    purpose: "health",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [7],
    // three letters (no I/O), two digits, then a digit + check digit (old) or letter + check letter (new)
    pattern: /^[A-HJ-NP-Z]{3}\d{2}(\d{2}|[A-HJ-NP-Z]{2})$/,
    example: "ZAC5361",
    sources: [
      "https://www.tewhatuora.govt.nz/for-health-providers/claims-provider-payments-and-entitlements/nhi-number-format-changes",
      "https://www.health.govt.nz/publication/hiso-10046-consumer-health-identity-standard",
      "https://en.wikipedia.org/wiki/NHI_Number",
    ],
    parse(id) {
      if (nhiCheckChar(id.slice(0, 6)) !== id[6]) return bad("invalid_checksum");
      return {
        ok: true,
        data: { extra: { format: /\d/.test(id[6]!) ? "old" : "new", test: id[0] === "Z" } },
      };
    },
  },
  {
    code: "NZ_NZBN",
    country: "NZ",
    name: "New Zealand Business Number",
    aliases: ["NZBN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^94\d{11}$/,
    example: "9429041000014",
    sources: [
      "https://www.nzbn.govt.nz/whats-an-nzbn/about/",
      "https://gs1nz.org/sectors/government/nzbn",
      "https://www.gs1.org/services/how-calculate-check-digit-manually",
    ],
    normalize: digitsOnly,
    parse: (id) =>
      gs1CheckDigit(id.slice(0, 12)) === Number(id[12]) ? { ok: true, data: { extra: {} } } : bad("invalid_checksum"),
  },
  {
    code: "NZ_DL",
    country: "NZ",
    name: "New Zealand Driver Licence Number",
    aliases: ["driver's licence", "driver license"],
    purpose: "driver_license",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^[A-Z]{2}\d{6}$/,
    example: "AB123456",
    sources: [
      "https://www.nzta.govt.nz/driver-licences/getting-a-licence/your-licence-card/",
      "https://en.wikipedia.org/wiki/National_identification_number#New_Zealand",
    ],
    upstream: ["idnumbers"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
