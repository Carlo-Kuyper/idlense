/**
 * Ireland — Personal Public Service Number (PPSN) and VAT number.
 *
 * PPSN: 7 digits, a check letter, and an optional second letter.
 * - Check: Σ digit·(8,7,6,5,4,3,2) + 9·value(second letter), mod 23, mapped to
 *   W,A,B,...,V (W = 0, A = 1 ... V = 22).
 * - Second letter: A, B or H (issued since 2013; counted in the check, H marks a
 *   non-individual) or the legacy W, T, X (pre-2013 suffixes, ignored by the check).
 *
 * VAT: IE + 8 or 9 characters.
 * - New form: the PPSN-style 7 digits + check letter (+ A/H second letter).
 * - Old form (pre-2013 companies): digit, letter/`+`/`*`, 5 digits, check letter;
 *   its check is the new-form check over "0" + digits 3-7 + digit 1.
 *
 * Improves on upstream:
 * - idnumbers counts every second letter A-W in the PPSN check; legacy W/T/X are
 *   suffixes that don't take part, and only A/B/H carry a value. Other second
 *   letters aren't issued (`invalid_format`). X was rejected outright.
 * - nationid IE_VAT rejects the old company form (`1A23456B`, `1+23456B`) still in
 *   use, and the B/H second letters.
 */
import { compact } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const ALPHABET = "WABCDEFGHIJKLMNOPQRSTUV";

/** Check letter for 7 digits and an optional (A/B/H) second letter. */
export function ieCheckLetter(digits7: string, second = ""): string {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += (digits7.charCodeAt(i) - 48) * (8 - i);
  if (second === "A" || second === "B" || second === "H") sum += 9 * ALPHABET.indexOf(second);
  return ALPHABET[sum % 23]!;
}

export const documents: DocumentSpec[] = [
  {
    code: "IE_PPSN",
    country: "IE",
    name: "Irish Personal Public Service Number",
    localName: "Uimhir Phearsanta Seirbhíse Poiblí",
    aliases: ["PPS number", "PPSN", "RSI number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [8, 9],
    pattern: /^\d{7}[A-W][ABHWTX]?$/,
    example: "1234567T",
    sources: [
      "https://www.gov.ie/en/service/12e6dc-get-a-personal-public-service-pps-number/",
      "https://www.revenue.ie/en/jobs-and-pensions/starting-your-first-job/pps-number.aspx",
      "https://en.wikipedia.org/wiki/Personal_Public_Service_Number",
    ],
    upstream: ["idnumbers"],
    parse(id) {
      const second = id[8] ?? "";
      if (ieCheckLetter(id.slice(0, 7), second) !== id[7]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 7), extra: second ? { secondLetter: second } : ({} as Record<string, string>) } };
    },
  },
  {
    code: "IE_VAT",
    country: "IE",
    name: "Irish VAT Number",
    aliases: ["VAT registration number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [10, 11],
    pattern: /^IE(?:\d{7}[A-W][ABHW]?|\d[A-Z+*]\d{5}[A-W])$/,
    example: "IE6433435F",
    sources: [
      "https://www.revenue.ie/en/vat/vat-registration/index.aspx",
      "https://ec.europa.eu/taxation_customs/vies/",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ],
    upstream: ["nationid"],
    normalize(input) {
      // `*` and `+` are part of old-form numbers.
      const c = compact(input);
      return /^(\d{7}[A-W][ABHW]?|\d[A-Z+*]\d{5}[A-W])$/.test(c) ? "IE" + c : c;
    },
    parse(id) {
      const b = id.slice(2);
      const old = !/^\d{7}/.test(b);
      const expected = old ? ieCheckLetter("0" + b.slice(2, 7) + b[0]) : ieCheckLetter(b.slice(0, 7), b[8] ?? "");
      if (expected !== b[7]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { form: old ? "old" : "new" } } };
    },
  },
];
