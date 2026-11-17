/**
 * Italy — codice fiscale (persons) and partita IVA (VAT).
 *
 * IT_CF — 16 characters, DM 23 dicembre 1976:
 *   SSS NNN YY M DD CCCC K
 *   - SSS/NNN consonant codes of surname and first name (not validated).
 *   - YY  year of birth; the century isn't encoded (latest past century).
 *   - M   month letter A B C D E H L M P R S T = Jan..Dec.
 *   - DD  day of birth; women add 40.
 *   - CCCC codice catastale of the comune of birth, or Z + 3 digits for a
 *         foreign country of birth.
 *   - K   check letter: odd/even position tables, sum mod 26.
 *   Omocodia: when two people would get the same code, the Agenzia delle
 *   Entrate replaces digits with letters (0-9 → L M N P Q R S T U V),
 *   starting from the rightmost digit and moving left (positions 15, 14,
 *   13, 11, 10, 8, 7).
 *
 * IT_PIVA — partita IVA, 11 digits: 7-digit taxpayer number, 3-digit office
 *   code, Luhn check digit. Same number as a company's codice fiscale.
 *
 * Improves on upstream:
 * - idnumbers fixes the century at YY < 50 → 20YY, so everyone born
 *   1900-1949 with YY up to 49 fails (e.g. 1945 reads as 2045, a future
 *   date); we take the latest past century.
 * - idnumbers and nationid accept omocodia letters in any position; only a
 *   right-to-left run of substitutions is ever issued.
 * - nationid doesn't check the birth date against the calendar (accepts
 *   30 February); idnumbers builds a local-time `Date`.
 * - P.IVA: we reject the all-zero taxpayer number and office code 000.
 */
import { luhnValid } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const MONTHS = "ABCDEHLMPRST";
const OMOCODIA = "LMNPQRSTUV";
/** Digit positions (0-based) in the order the Agenzia substitutes them. */
const SUBSTITUTION_ORDER = [14, 13, 12, 10, 9, 7, 6];
// prettier-ignore
const ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];

const charIndex = (c: string) => (c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65);

export function cfCheckLetter(first15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const v = charIndex(first15[i]!);
    sum += i % 2 === 0 ? ODD[v]! : v;
  }
  return String.fromCharCode(65 + (sum % 26));
}

/** Undo omocodia substitutions. Undefined when the letters aren't a right-to-left run. */
export function cfDecode(cf: string): string | undefined {
  const chars = [...cf];
  let seenDigit = false;
  for (const p of SUBSTITUTION_ORDER) {
    const c = chars[p]!;
    if (c >= "0" && c <= "9") seenDigit = true;
    else if (seenDigit) return undefined;
    else chars[p] = String(OMOCODIA.indexOf(c));
  }
  return chars.join("");
}

export const documents: DocumentSpec[] = [
  {
    code: "IT_CF",
    country: "IT",
    name: "Italian Tax Code",
    localName: "Codice fiscale",
    aliases: ["CF", "fiscal code", "tessera sanitaria"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [16],
    pattern: /^[A-Z]{6}[\dL-NP-V]{2}[ABCDEHLMPRST][0-7L-NP-T][\dL-NP-V][A-Z][\dL-NP-V]{3}[A-Z]$/,
    example: "RSSMRA85M01H501Q",
    sources: [
      "https://www.agenziaentrate.gov.it/portale/web/guest/schede/istanze/richiesta-ts_cf/informazioni-codificazione-pf",
      "https://www.gazzettaufficiale.it/eli/id/1977/02/09/076U0001/sg",
      "https://it.wikipedia.org/wiki/Codice_fiscale",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: compact,
    parse(cf, { referenceDate }) {
      const d = cfDecode(cf);
      if (!d) return { ok: false, reason: "invalid_format" };
      const yy = Number(d.slice(6, 8));
      const month = MONTHS.indexOf(d[8]!) + 1;
      let day = Number(d.slice(9, 11));
      const female = day > 40;
      if (female) day -= 40;
      const year = latestPastYear(yy, month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (cfCheckLetter(cf) !== cf[15]) return { ok: false, reason: "invalid_checksum" };
      const region = d.slice(11, 15);
      return {
        ok: true,
        data: {
          ...birth,
          gender: female ? "female" : "male",
          region,
          extra: {
            surnameCode: cf.slice(0, 3),
            nameCode: cf.slice(3, 6),
            bornAbroad: region[0] === "Z",
            omocodia: d !== cf,
          },
        },
      };
    },
  },
  {
    code: "IT_PIVA",
    country: "IT",
    name: "Italian VAT Number",
    localName: "Partita IVA",
    aliases: ["P.IVA", "VAT number", "codice fiscale (company)"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345670017",
    sources: [
      "https://www.agenziaentrate.gov.it/portale/web/guest/schede/istanze/aa7_9-dichiarazione-inizio-attivita-iva",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: (s) => {
      const c = compact(s);
      return /^IT\d{11}$/.test(c) ? c.slice(2) : digitsOnly(c);
    },
    parse(id) {
      if (/^0{7}/.test(id) || id.slice(7, 10) === "000") return { ok: false, reason: "invalid_range" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 7), region: id.slice(7, 10), extra: {} } };
    },
  },
];
