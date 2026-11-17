/**
 * Fiji — Fiji Revenue and Customs Service (FRCS) Taxpayer Identification
 * Number.
 *
 * Per FRCS's registration page, a TIN has 9 or 10 digits and no dashes.
 *
 * FJ_TIN, the 9-digit TIN of the old system. The first two digits give the
 * registration type: 01-26 individual, 30 partnership, 40 shipping and
 * insurance, 50 company, 60 non-profit organisation, 70 estate, 75 trust,
 * 80 co-operative, 90 government. Other prefixes are `invalid_range`.
 * The 9th digit is a check digit: Σ d[i]·(3,1,3,1,3,1,3,1) over the first 8
 * digits, mod 10. FRCS doesn't publish it; we derived it and confirmed it on
 * 720 of the 724 TINs in an FRCS public notice (the other 4 look like typos)
 * and on company TINs such as the University of the South Pacific's
 * 600048307 from its tax clearance certificate. Confidence `low`
 * (reverse-engineered, though against a large issuer-published sample).
 *
 * FJ_TIN_TPOS, the 10-digit TIN issued by the Taxpayer Online Services
 * system (TPOS). Always starts with 29 and doesn't encode the type. We found
 * no published TPOS TINs, so no check digit is verified. Confidence `high`
 * for the shape (issuer page).
 *
 * Not covered: the national/digital ID and FNPF member numbers (no format
 * published).
 */
import { digit, isDigits } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const FRCS_REG = "https://frcs.org.fj/?p=28371";

/** Check digit for the first 8 digits of a 9-digit TIN. */
export function fjTinCheckDigit(first8: string): number | undefined {
  if (first8.length < 8 || !isDigits(first8.slice(0, 8))) return undefined;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += digit(first8, i) * (i % 2 === 0 ? 3 : 1);
  return sum % 10;
}

function tinType(prefix: string): string | undefined {
  const p = Number(prefix);
  if (p >= 1 && p <= 26) return "individual";
  return (
    {
      "30": "partnership",
      "40": "shipping_insurance",
      "50": "company",
      "60": "non_profit",
      "70": "estate",
      "75": "trust",
      "80": "cooperative",
      "90": "government",
    } as Record<string, string>
  )[prefix];
}

export const documents: DocumentSpec[] = [
  {
    code: "FJ_TIN",
    country: "FJ",
    name: "Fijian Taxpayer Identification Number",
    aliases: ["TIN", "FRCS TIN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "500123452",
    sources: [
      FRCS_REG,
      "https://www.frcs.org.fj/wp-content/uploads/2018/12/FRCS-4-Pages-.pdf",
      "https://www.usp.ac.fj/finance-unit/wp-content/uploads/sites/59/2025/07/Blanket-Tax-Clearance-Certificate-2025.pdf",
    ],
    normalize: digitsOnly,
    parse(id) {
      const type = tinType(id.slice(0, 2));
      if (!type) return { ok: false, reason: "invalid_range" };
      if (fjTinCheckDigit(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(2, 8), extra: { taxpayerType: type } } };
    },
  },
  {
    code: "FJ_TIN_TPOS",
    country: "FJ",
    name: "Fijian Taxpayer Identification Number (TPOS)",
    aliases: ["TIN", "FRCS TIN", "TPOS TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "high",
    lengths: [10],
    pattern: /^29\d{8}$/,
    example: "2900012345",
    sources: [FRCS_REG],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id.slice(2), extra: {} } };
    },
  },
];
