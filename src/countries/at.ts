/**
 * Austria — social insurance number, tax number, VAT number.
 *
 * AT_SVNR — Sozialversicherungsnummer (Versicherungsnummer), 10 digits
 *   LLLC DDMMYY:
 *   - LLL serial 100-999.
 *   - C   check digit: Σ(3,7,9 · LLL; 5,8,4,2,1,6 · DDMMYY) mod 11. A
 *         remainder of 10 is never issued (the serial is bumped instead).
 *   - DDMMYY is usually the date of birth. When it can't be documented,
 *         the insurer uses 1 Jan / 1 Jul of the year and, once those run
 *         out, days above 31 and months above 12. So an impossible date is
 *         not an error; we just don't extract one. The century isn't
 *         encoded (latest past century).
 *
 * AT_STEUERNUMMER — Abgabenkontonummer / Steuernummer, 9 digits FF-NNN/NNNC:
 *   FF Finanzamt code, then the taxpayer number, last digit Luhn.
 *
 * AT_UID — Umsatzsteuer-Identifikationsnummer: `ATU` + 8 digits; the last is
 *   (10 − (4 + Luhn-sum of the 7 digits, doubling 2nd/4th/6th)) mod 10 (BMF
 *   UID-Konstruktionsregeln).
 *
 * Improves on upstream:
 * - idnumbers treats any 10-digit input as a valid Austrian tax number
 *   (only `1237010181` is special-cased to fail); those are social insurance
 *   numbers, which we validate as AT_SVNR with the real check digit.
 * - The social insurance number is new: neither upstream had it.
 */
import { luhnValid, weightedSum } from "../core/algorithms.js";
import { birthFields, isRealDate, latestPastYear } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const SVNR_W = [3, 7, 9, 0, 5, 8, 4, 2, 1, 6];

export function uidCheckDigit(body7: string): number {
  let sum = 4;
  for (let i = 0; i < 7; i++) {
    let d = Number(body7[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export const documents: DocumentSpec[] = [
  {
    code: "AT_SVNR",
    country: "AT",
    name: "Austrian Social Insurance Number",
    localName: "Sozialversicherungsnummer",
    aliases: ["SVNR", "SV-Nummer", "Versicherungsnummer", "VSNR", "e-card number"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[1-9]\d{9}$/,
    example: "1237010180",
    sources: [
      "https://www.sozialversicherung.at/",
      "https://de.wikipedia.org/wiki/Sozialversicherungsnummer#Österreich",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 6], " "),
    parse(id, { referenceDate }) {
      const sum = weightedSum(id, SVNR_W) % 11;
      if (sum === 10 || sum !== Number(id[3])) return { ok: false, reason: "invalid_checksum" };
      const day = Number(id.slice(4, 6));
      const month = Number(id.slice(6, 8));
      const yy = Number(id.slice(8, 10));
      const extra: Record<string, boolean> = {};
      let birth;
      if (isRealDate(2000, month, day)) {
        const year = latestPastYear(yy, month, day, referenceDate);
        birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      }
      if (!birth) extra.substituteDate = true;
      return { ok: true, data: { ...birth, serial: id.slice(0, 3), extra } };
    },
  },
  {
    code: "AT_STEUERNUMMER",
    country: "AT",
    name: "Austrian Tax Number",
    localName: "Abgabenkontonummer",
    aliases: ["Steuernummer", "StNr", "ATIN", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456782",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/austria-tin.pdf",
      "https://www.bmf.gv.at/",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 2)}-${c.slice(2, 5)}/${c.slice(5)}`,
    parse(id) {
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { region: id.slice(0, 2), serial: id.slice(2, 8), extra: {} } };
    },
  },
  {
    code: "AT_UID",
    country: "AT",
    name: "Austrian VAT Identification Number",
    localName: "Umsatzsteuer-Identifikationsnummer",
    aliases: ["UID", "UID-Nummer", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^ATU\d{8}$/,
    example: "ATU12345675",
    sources: [
      "https://www.bmf.gv.at/dam/jcr:9f9f8d5f-5496-4886-aa4f-81a4e39ba83e/BMF_UID_Konstruktionsregeln.pdf",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: (s) => {
      const c = compact(s);
      if (/^U\d{8}$/.test(c)) return "AT" + c;
      if (/^AT\d{8}$/.test(c)) return "ATU" + c.slice(2);
      return c;
    },
    format: (c) => `ATU ${c.slice(3, 7)} ${c.slice(7)}`,
    parse(id) {
      if (uidCheckDigit(id.slice(3, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
