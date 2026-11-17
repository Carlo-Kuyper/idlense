/**
 * Mauritius — National Identity Card number, assigned at birth.
 * 14 characters: L DDMMYY NNNNNN K.
 *
 * - L       first letter of the holder's surname at birth.
 * - DDMMYY  date of birth. The century isn't encoded, so we take the latest
 *           century that puts the date in the past.
 * - NNNNNN  unique sequence.
 * - K       check character (digit or letter).
 *
 * The check-character algorithm isn't public. python-stdnum implements one
 * from a specification a Mauritian government IT adviser shared privately,
 * checked against the MRA's online service. We can't confirm it from a
 * citable source or enough published samples, so this is shape-only.
 * Confidence `moderate`: python-stdnum's documentation, its mailing-list
 * discussion and a second library's docs all agree on the layout.
 */
import { birthFields, latestPastYear } from "../core/dates.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "MU_NIC",
    country: "MU",
    name: "Mauritian National Identity Card Number",
    aliases: ["NIC", "NID", "national identity number", "ID card number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [14],
    // letter, DD 01-31, MM 01-12, YY, 6-digit sequence, check character
    pattern: /^[A-Z](0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{8}[0-9A-Z]$/,
    example: "A0101800000017",
    sources: [
      "https://mnis.govmu.org/English/ID%20Card/Pages/default.aspx",
      "https://arthurdejong.org/python-stdnum/doc/stdnum.mu.nid",
      "https://lists.arthurdejong.org/python-stdnum-users/2018/msg00003.html",
      "https://lists.arthurdejong.org/python-stdnum-users/2018/msg00007.html",
      "https://docs.dataprep.ai/user_guide/clean/clean_mu_nid.html",
    ],
    parse(id, { referenceDate }) {
      const day = Number(id.slice(1, 3));
      const month = Number(id.slice(3, 5));
      const year = latestPastYear(Number(id.slice(5, 7)), month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: { ...birth, serial: id.slice(7, 13), extra: { surnameInitial: id[0]! } },
      };
    },
  },
];
