/**
 * South Africa — 13-digit identity number: YYMMDD SSSS C A Z.
 *
 * - YYMMDD date of birth. The century isn't encoded: we take the latest
 *   century that puts the date in the past. IDs are issued at birth, so the
 *   "holder must be 16+" rule in south-african-id-validator would read a
 *   child born in 2015 as 1915.
 * - SSSS   0000-4999 female, 5000-9999 male.
 * - C      0 citizen, 1 permanent resident, 2 refugee (SARS in the OECD
 *          South Africa TIN sheet). Upstream libraries reject 2, but Home
 *          Affairs issues refugee IDs. The Identification Act regulation
 *          (R978, reg. 3) still lists only 0 (SA citizen) and 1 (non-SA
 *          citizen); we follow the newer OECD/SARS description.
 * - A      historically a race marker (pre-1986); usually 8 now. Not validated.
 * - Z      Luhn check digit over the first 12 digits.
 *
 * Ported from south-african-id-parser, south-african-id-validator and idnumbers.
 */
import { luhnValid } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const ZA_CITIZENSHIP: Record<string, string> = {
  "0": "citizen",
  "1": "permanent_resident",
  "2": "refugee",
};

export const documents: DocumentSpec[] = [
  {
    code: "ZA_ID",
    country: "ZA",
    name: "South African Identity Number",
    aliases: ["SA ID", "RSA ID", "green ID book", "smart ID card"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/,
    example: "8001015009087",
    sources: [
      "https://www.dha.gov.za/index.php/civic-services/identity-documents",
      "https://www.westerncape.gov.za/general-publication/decoding-your-south-african-id-number-0",
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/South-Africa-TIN.pdf",
      "https://source.acts.co.za/identification-act-1997/r978_3__identity_number.php",
    ],
    upstream: ["south-african-id-parser", "south-african-id-validator", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 4, 3], " "),
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(0, 2));
      const month = Number(id.slice(2, 4));
      const day = Number(id.slice(4, 6));
      const year = latestPastYear(yy, month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const citizenship = ZA_CITIZENSHIP[id[10]!];
      if (!citizenship) return { ok: false, reason: "invalid_format" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      const serial = id.slice(6, 10);
      return {
        ok: true,
        data: {
          ...birth,
          gender: Number(serial) < 5000 ? "female" : "male",
          citizenship,
          serial,
          extra: {},
        },
      };
    },
  },
];
