/**
 * Moldova — IDNP (Numărul de identificare de stat al persoanei fizice) and
 * IDNO (Numărul de identificare de stat al unității de drept).
 *
 * 13 digits (HG 333/2023, annex 2): 2 ГГГ XXX YYYYY K
 * - 2    index of natural persons among state identifiers (legal entities' IDNO
 *        starts with 1). IDNPs assigned in the 1990s, still in circulation, start
 *        with 0; that prefix is accepted but not decoded (not in the current
 *        regulation, so unverified).
 * - ГГГ  last three digits of the year the IDNP was assigned.
 * - XXX  registrar office. YYYYY order number in that year and office.
 * - K    check digit by a "special algorithm" that is not published.
 * Nothing about the holder (birth date, sex) is encoded.
 *
 * Improves on upstream: idnumbers accepts any 13 digits (its own example starts
 * with 1, an IDNO); we require a 0/2 first digit. The check digit
 * isn't verified because the issuer doesn't publish it (checksum: false).
 *
 * IDNO, 13 digits (HG 272/2002, annex 2, as quoted in Moldova's OECD TIN
 * sheet): 1 XXX YYY ZZZZZ K. It is the legal entity's TIN.
 * - 1      index of legal units among state identifiers.
 * - XXX    last three digits of the year the IDNO was assigned. 990-999 are
 *          read as 1990-1999, anything else as 20XX; a year after the
 *          reference date is `invalid_range`.
 * - YYY    code of the registering office (600-611 in published lists).
 * - ZZZZZ  order number in that year and office.
 * - K      check digit. Neither the sheet nor the regulation gives the
 *          algorithm. Σ digit × 7,3,1,7,3,1,... over the first 12 digits,
 *          mod 10, matches all 1861 IDNOs in two official lists (SFS large
 *          taxpayers 2021-22 and ASP's February 2026 registration bulletin),
 *          so we enforce it; confidence `moderate` because it is derived, not
 *          published. The IDNP's "special algorithm" is not modelled here, so
 *          we can't say whether it is the same rule.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** IDNO check digit: Σ digit × 7,3,1 (repeating) over the first 12 digits, mod 10. */
export function mdIdnoCheckDigit(first12: string): number {
  return weightedSum(first12, [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1]) % 10;
}

const OECD_SHEET = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/moldova-tin.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "MD_IDNP",
    country: "MD",
    name: "Moldovan Personal Identification Number",
    localName: "Numărul de identificare de stat (IDNP)",
    aliases: ["IDNP", "cod personal", "personal code"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [13],
    pattern: /^[02]\d{12}$/,
    example: "2002001234567",
    sources: [
      "https://oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Moldova-TIN.pdf",
      "https://e-services.md/ro/verifica-idnp",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 3, 5, 1], " "),
    parse(id, { referenceDate }): ParseOutcome {
      const year = 2000 + Number(id.slice(1, 4));
      // Decode only what the current regulation defines: index 2 and a year not in the future.
      if (id[0] !== "2" || year > referenceDate.getFullYear()) return { ok: true, data: { extra: {} } };
      return {
        ok: true,
        data: { serial: id.slice(7, 12), extra: { assignmentYear: year, office: id.slice(4, 7) } },
      };
    },
  },
  {
    code: "MD_IDNO",
    country: "MD",
    name: "Moldovan State Identification Number of Legal Units",
    localName: "Numărul de identificare de stat (IDNO)",
    aliases: ["IDNO", "cod fiscal", "fiscal code", "TIN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [13],
    pattern: /^1\d{12}$/,
    example: "1026600123452",
    sources: [
      OECD_SHEET,
      "https://dataset.gov.md/resources/2022-01/Contribuabili%20mari%202021-2022.pdf",
      "https://www.asp.gov.md/sites/default/files/date-deschise/date-statistice/2026/rsud/buletinul-electronic/Buletinul-Electronic-02-2026.pdf",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 3, 3, 5, 1], " "),
    parse(id, { referenceDate }): ParseOutcome {
      const xxx = Number(id.slice(1, 4));
      const year = (xxx >= 990 ? 1000 : 2000) + xxx;
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_range" };
      if (mdIdnoCheckDigit(id) !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: { serial: id.slice(7, 12), extra: { assignmentYear: year, office: id.slice(4, 7) } },
      };
    },
  },
];
