/**
 * Afghanistan — electronic Tazkira (e-Tazkira) number and the Ministry of
 * Finance Taxpayer Identification Number.
 *
 * AF_TAZKIRA, 13 digits written YYYY-MMXX-XXXXX (issued since May 2018,
 * Solar Hijri year 1397). Per Landinfo's 2023 note, citing the Norwegian and
 * Danish national ID centres:
 * - YYYY issue year in the Solar Hijri (Persian) calendar.
 * - MM   issue month (01-12).
 * - the last digit of the third group encodes the holder's sex, but the
 *        values aren't published, so we don't extract it.
 * The number is unrelated to the old paper Tazkira's register reference. No
 * check digit is documented. We reject issue years before 1397 or after the
 * current Solar Hijri year (`invalid_range`). Confidence `moderate`: one
 * agency report, consistent with the 4-4-5 grouping on Wikipedia.
 *
 * AF_TIN, the 10-digit TIN from the Ministry of Finance (Guide 18, "a unique
 * 10-digit number"). No structure or check digit is published. Confidence
 * `moderate`.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Latest Solar Hijri year that can have started by `date` (lenient by a few months). */
const currentSolarHijriYear = (date: Date) => date.getFullYear() - 621;

export const documents: DocumentSpec[] = [
  {
    code: "AF_TAZKIRA",
    country: "AF",
    name: "Afghan Electronic National Identity Card Number",
    localName: "e-Tazkira",
    aliases: ["Tazkira", "Tazkera", "تذکره", "e-NIC", "electronic Tazkira"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    pattern: /^1[34]\d{2}(0[1-9]|1[0-2])\d{7}$/,
    example: "1400010112345",
    sources: [
      "https://www.ecoi.net/en/file/local/2094117/Temanotat-Afghanistan-Tazkera-pass-og-andre-ID-dokumenter-28062023.pdf",
      "https://en.wikipedia.org/wiki/Afghan_identity_card",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 5], "-"),
    parse(id, { referenceDate }) {
      const year = Number(id.slice(0, 4));
      if (year < 1397 || year > currentSolarHijriYear(referenceDate)) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: { serial: id.slice(6), extra: { issueYearSolarHijri: year, issueMonth: Number(id.slice(4, 6)) } },
      };
    },
  },
  {
    code: "AF_TIN",
    country: "AF",
    name: "Afghan Taxpayer Identification Number",
    aliases: ["TIN", "شماره تشخیصیه مالیه دهنده"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://mof.gov.af/sites/default/files/2019-03/Guide%2018%20-%20Taxpayer%20Identification%20Number%20%28TIN%29-min.pdf",
    ],
    normalize: digitsOnly,
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
