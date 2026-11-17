/**
 * Namibia — national identity number. 11 digits: YYMMDD SSSSS.
 *
 * - The Identification Act 21 of 1996, s.4: the Minister assigns "an identity
 *   number consisting of eleven figures" when issuing an identity document.
 * - The UN ESCAP / CRVS Centre of Excellence compendium (Namibia case study)
 *   says "The format of the UIN is a logical construct based on date of
 *   birth". It doesn't give positions.
 * - Positions: we compared 1,042 deceased-estate notices (Form J 193) in the
 *   Government Gazette, which print the date of birth next to the identity
 *   number. 1,029 start with the birth date as YYMMDD; the 13 that don't look
 *   like typos in the notice. The other 5 digits behave like a per-date
 *   sequence (the leading ones are mostly 0) and match no common check-digit
 *   scheme (Luhn, mod 10/11 with usual weights, ICAO 7-3-1), so we treat them
 *   as a serial with no check digit.
 * - The century isn't encoded; we take the latest one that gives a past date.
 *
 * Sex and citizenship aren't encoded as far as anyone documents, so we don't
 * extract them. The older 13-digit South West Africa ID numbers (which had a
 * racial code) are still linked in the population register but aren't modelled.
 *
 * Shape-only. Confidence `moderate`: the length is in the Act, the date prefix
 * is described by an official CRVS case study and holds for 99% of
 * ~1,000 gazetted numbers.
 */
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "NA_ID",
    country: "NA",
    name: "Namibian Identity Number",
    aliases: ["ID number", "UIN", "national ID", "identity document number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{5}$/,
    example: "85042300123",
    sources: [
      "https://www.lac.org.na/laws/annoSTAT/Identification%20Act%2021%20of%201996.pdf",
      "https://crvs.unescap.org/sites/default/files/resources/Case%20Study_Namibia.pdf",
      "https://unstats.un.org/legal-identity-agenda/documents/Paper/2023/CRVSID-Namibia.pdf",
      "https://www.lac.org.na/laws/2014/5627.pdf",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 5], " "),
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(0, 2));
      const m = Number(id.slice(2, 4));
      const d = Number(id.slice(4, 6));
      const year = latestPastYear(yy, m, d, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, m, d, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return { ok: true, data: { ...birth, serial: id.slice(6), extra: {} } };
    },
  },
];
