/**
 * El Salvador — DUI, NIT and passport.
 *
 * DUI (RNPN), 9 digits `NNNNNNNN-V`: check = (10 − Σ digit[i]·(9−i) mod 10) mod 10.
 * Since 2021 (Decreto 763) the DUI also serves as a natural person's NIT.
 *
 * NIT (Ministerio de Hacienda), 14 digits `MMMM-DDMMYY-CCC-V`:
 * - MMMM   municipality (department 01-14 + municipality); 9xxx for foreigners.
 * - DDMMYY date of birth (people) or of incorporation (companies).
 * - CCC    correlativo; V check digit. Hacienda keeps the algorithm private,
 *          but two schemes are consistent with every published NIT:
 *   - CCC ≤ 100: weights 14..2 left to right, check = (Σ mod 11) mod 10.
 *   - CCC > 100: weights 2-7 cycling from the right, check = ((−Σ) mod 11) mod 10.
 *
 * Improves on upstream:
 * - NIT: nationid uses only the first weighting with `11 − Σ mod 11`, which
 *   rejects most real NITs (e.g. the Ministry's own list of public bodies:
 *   UES 0614-110121-001-3, CEL 0614-180948-001-4, and python-stdnum's
 *   documented 0614-050707-104-8). We implement both schemes above,
 *   cross-checked against those published numbers.
 * - NIT: rejects impossible dates and unknown department codes (`invalid_range`).
 * - DUI: rejects the all-zero placeholder 00000000-0.
 */
import { cyclicWeightsFromRight, weightedSum } from "../core/algorithms.js";
import { isoDate, latestPastYear } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const SV_DEPARTMENTS: readonly string[] = [
  "Ahuachapán",
  "Santa Ana",
  "Sonsonate",
  "Chalatenango",
  "La Libertad",
  "San Salvador",
  "Cuscatlán",
  "La Paz",
  "Cabañas",
  "San Vicente",
  "Usulután",
  "San Miguel",
  "Morazán",
  "La Unión",
];

export function svDuiCheck(body8: string): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += (body8.charCodeAt(i) - 48) * (9 - i);
  return (10 - (sum % 10)) % 10;
}

const OLD_WEIGHTS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const NEW_WEIGHTS = cyclicWeightsFromRight(13);

export function svNitCheck(body13: string): number {
  if (Number(body13.slice(10, 13)) <= 100) return (weightedSum(body13, OLD_WEIGHTS) % 11) % 10;
  return ((11 - (weightedSum(body13, NEW_WEIGHTS) % 11)) % 11) % 10;
}

export const documents: DocumentSpec[] = [
  {
    code: "SV_DUI",
    country: "SV",
    name: "Salvadoran Unique Identity Document",
    localName: "Documento Único de Identidad",
    aliases: ["DUI"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456784",
    sources: [
      "https://www.rnpn.gob.sv/",
      "https://docs.v3.localpayment.com/api-reference-guide/document-validations/el-salvador",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 8)}-${c[8]}`,
    parse(id) {
      if (id === "000000000") return { ok: false, reason: "invalid_format" };
      if (svDuiCheck(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 8), extra: {} } };
    },
  },
  {
    code: "SV_NIT",
    country: "SV",
    name: "Salvadoran Tax Identification Number",
    localName: "Número de Identificación Tributaria",
    aliases: ["NIT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [14],
    // municipality, DDMMYY, correlativo, check
    pattern: /^\d{4}(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{6}$/,
    example: "06141505901015",
    sources: [
      "https://transparencia.mh.gob.sv/downloads/pdf/PMHDC10917.pdf",
      "https://www.mh.gob.sv/wp-content/uploads/2020/11/PMHDC9225.pdf",
      "https://arthurdejong.org/python-stdnum/doc/stdnum.sv.nit",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 4)}-${c.slice(4, 10)}-${c.slice(10, 13)}-${c[13]}`,
    parse(id, { referenceDate }) {
      const dept = Number(id.slice(0, 2));
      const foreign = id[0] === "9";
      if (!foreign && (dept < 1 || dept > 14)) return { ok: false, reason: "invalid_range" };
      const day = Number(id.slice(4, 6));
      const month = Number(id.slice(6, 8));
      const year = latestPastYear(Number(id.slice(8, 10)), month, day, referenceDate);
      if (year === undefined) return { ok: false, reason: "invalid_date" };
      if (svNitCheck(id) !== Number(id[13])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          region: id.slice(0, 4),
          ...(foreign ? { citizenship: "foreigner" } : { regionName: SV_DEPARTMENTS[dept - 1] }),
          serial: id.slice(10, 13),
          // birth date for people, incorporation date for companies
          extra: { date: isoDate(year, month, day) },
        },
      };
    },
  },
  {
    code: "SV_PASAPORTE",
    country: "SV",
    name: "Salvadoran Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7, 8, 9, 10],
    pattern: /^[A-Z]?\d{7,9}$/,
    example: "123456789",
    sources: ["https://www.migracion.gob.sv/", "https://en.wikipedia.org/wiki/Salvadoran_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
