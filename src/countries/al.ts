/**
 * Albania — personal number (NID, Numri i Identitetit) and the business tax
 * number (NIPT / NUIS).
 *
 * NID, 10 characters: Y y MM DD SSS C (tax administration, OECD TIN sheet):
 * - Y   decade of birth: 0-9 → 1800s-1890s, A-J → 1900s-1990s, K-T → 2000s-2090s
 *       (the published specimen I05101999Q is a woman born 1980-01-01).
 * - y   year within the decade.
 * - MM  month; +50 for women.
 * - DD  day. SSS issuing order within the date. C check letter (A-W).
 * The check-letter formula isn't published ("calculated according to a formula
 * that depends on the first 9 characters"), so it isn't verified.
 *
 * NIPT, 10 characters: L y MM DD SSS C — decade letter of issue (J 1990s, K 2000s,
 * L 2010s, M 2020s), year, district-converted month, day, order, check letter.
 * Issued to legal entities and people exercising an economic activity. Shape only.
 *
 * Improves on upstream:
 * - idnumbers' check-letter "validation" accepts any letter while its pattern
 *   allows only A-W; we keep A-W and don't claim a checksum (checksum: false).
 * - Month must be 01-12 or 51-62; idnumbers accepts e.g. month 13-50 via its
 *   date check only after building a Date. Future birth dates are rejected.
 * - NIPT is new (idnumbers lists the name but validates only the NID shape).
 */
import { birthFields } from "../core/dates.js";
import type { DocumentSpec } from "../core/types.js";

const DECADES = "0123456789ABCDEFGHIJKLMNOPQRST";

export const documents: DocumentSpec[] = [
  {
    code: "AL_NID",
    country: "AL",
    name: "Albanian Personal Number",
    localName: "Numri i Identitetit",
    aliases: ["NID", "NISH", "numri personal", "Albanian ID number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[0-9A-T]\d(0[1-9]|1[0-2]|5[1-9]|6[0-2])(0[1-9]|[12]\d|3[01])\d{3}[A-W]$/,
    example: "I05101999Q",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Albania-TIN.pdf",
      "https://www.tatime.gov.al/eng/c/3/12/21/individual",
      "https://en.wikipedia.org/wiki/Albanian_identity_card",
    ],
    upstream: ["idnumbers"],
    parse(id, { referenceDate }) {
      const year = 1800 + DECADES.indexOf(id[0]!) * 10 + Number(id[1]);
      const mm = Number(id.slice(2, 4));
      const female = mm > 50;
      const birth = birthFields(year, female ? mm - 50 : mm, Number(id.slice(4, 6)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return { ok: true, data: { ...birth, gender: female ? "female" : "male", serial: id.slice(6, 9), extra: {} } };
    },
  },
  {
    code: "AL_NIPT",
    country: "AL",
    name: "Albanian Taxpayer Identification Number",
    localName: "Numri i Identifikimit për Personin e Tatueshëm",
    aliases: ["NIPT", "NUIS"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[J-M]\d{3}(0[1-9]|[12]\d|3[01])\d{3}[A-Z]$/,
    example: "K12113002H",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Albania-TIN.pdf",
      "https://www.tatime.gov.al/eng/c/4/103/business-lifecycle",
    ],
    parse(id) {
      return { ok: true, data: { serial: id.slice(6, 9), extra: { issueYear: 1990 + (id.charCodeAt(0) - 74) * 10 + Number(id[1]) } } };
    },
  },
];
