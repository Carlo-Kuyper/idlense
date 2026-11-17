/**
 * Eswatini — Personal Identification Number (PIN) and ERS TIN.
 *
 * SZ_PIN, the identity number on the national ID card and birth certificate.
 * 13 digits: YYMMDD X C SSSS K.
 *
 * The Identification Order, 1998 (King's Order in Council 4 of 1998), s.5(2),
 * says the identity number is "compiled in the prescribed manner out of
 * figures" and, besides "a serial, index and control number", encodes the
 * holder's sex and date of birth, whether or not they are a citizen, and for
 * a Swazi their region, chief and indvuna. The regulation with the positions
 * isn't published online, so the positions below are reverse-engineered from
 * 18 PINs quoted in court judgments on EswatiniLII:
 * - YYMMDD date of birth. Every sample matches the birth date given in the
 *   judgment where one is given. The century isn't encoded.
 * - X      sex. 1 for the women in the samples and 6 for the men, so we map
 *          1 → female and 6 → male and leave other values unmapped
 *          (`extra.sexDigit` keeps the raw digit).
 * - C      0 for the foreign nationals in the samples, 1 for Swazis, and
 *          occasionally 2 or 3. It probably carries the citizenship/region
 *          code from s.5(2), but that isn't confirmed, so we only return it
 *          raw as `extra.eighthDigit`.
 * - SSSS   serial.
 * - K      Luhn check digit over the first 12 digits (as in South Africa's ID
 *          number). 17 of the 18 samples pass; the one that fails comes from a
 *          judgment with other transcription slips.
 *
 * Confidence `low`: the encoded fields come from the Order, but the positions
 * and the check digit are reverse-engineered.
 *
 * SZ_TIN, the Eswatini Revenue Service taxpayer number: 9 digits from
 * 100000000 to 199999999 (the range ERS's own VAT check accepts), no published
 * check digit. Also used as the VAT number. One secondary source, so `low`.
 */
import { luhnValid } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, Gender } from "../core/types.js";

export const SZ_SEX: Record<string, Gender> = { "1": "female", "6": "male" };

export const documents: DocumentSpec[] = [
  {
    code: "SZ_PIN",
    country: "SZ",
    name: "Eswatini Personal Identification Number",
    aliases: ["PIN", "ID number", "national ID", "Swazi ID"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "low",
    lengths: [13],
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/,
    example: "8504236100122",
    sources: [
      "https://eswatinilii.org/akn/sz/act/order-in-council/1998/4/eng@1998-12-01",
      "https://eswatinilii.org/akn/sz/judgment/szhc/2020/98/eng@2020-05-26",
      "https://eswatinilii.org/akn/sz/judgment/szhc/2021/134/eng@2021-08-20",
      "https://eswatinilii.org/akn/sz/judgment/szhc/2021/34/eng@2021-03-30",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 7], " "),
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(0, 2));
      const m = Number(id.slice(2, 4));
      const d = Number(id.slice(4, 6));
      const year = latestPastYear(yy, m, d, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, m, d, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      const gender = SZ_SEX[id[6]!];
      return {
        ok: true,
        data: {
          ...birth,
          ...(gender ? { gender } : {}),
          serial: id.slice(8, 12),
          extra: { sexDigit: id[6]!, eighthDigit: id[7]! },
        },
      };
    },
  },
  {
    code: "SZ_TIN",
    country: "SZ",
    name: "Eswatini Revenue Service Taxpayer Identification Number",
    aliases: ["ERS TIN", "TIN", "VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [9],
    pattern: /^1\d{8}$/,
    example: "123456789",
    sources: ["https://lookuptax.com/validate/eswatini/tin"],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
];
