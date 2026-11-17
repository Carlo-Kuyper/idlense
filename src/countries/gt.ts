/**
 * Guatemala — DPI/CUI, NIT and passport.
 *
 * DPI / CUI (RENAP), 13 digits: NNNNNNNN V DD MM
 * - NNNNNNNN correlativo.
 * - V        check digit: Σ digit[i]·(i+2) over the correlativo, mod 11
 *            (the plain remainder; a remainder of 10 is never issued).
 * - DD       department (01-22) of birth for Guatemalan nationals; of
 *            registration for naturalised citizens and residents.
 * - MM       municipality within that department, same rule (01..count, 340
 *            in total since Sipacate and Petatán were created in 2015).
 *            Source: Sayari, "Interpreting Guatemalan National ID Numbers".
 * Displayed as 4-5-4 (`NNNN NNNNN NNNN`), which does not follow the fields.
 *
 * NIT (SAT): 1-12 digit body + check character. Weights 2,3,4,... from the
 * right, check = (11 − Σ mod 11) mod 11, 10 written `K`.
 *
 * Improves on upstream:
 * - DPI: nationid accepts any municipality 00-99 once the department is
 *   01-22; we use idnumbers' per-department municipality counts (rejected
 *   as `invalid_range`) and return the department name.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Departments in RENAP/INE order with their municipality counts (340 in total). */
export const GT_DEPARTMENTS: readonly (readonly [string, number])[] = [
  ["Guatemala", 17],
  ["El Progreso", 8],
  ["Sacatepéquez", 16],
  ["Chimaltenango", 16],
  ["Escuintla", 14],
  ["Santa Rosa", 14],
  ["Sololá", 19],
  ["Totonicapán", 8],
  ["Quetzaltenango", 24],
  ["Suchitepéquez", 21],
  ["Retalhuleu", 9],
  ["San Marcos", 30],
  ["Huehuetenango", 33],
  ["Quiché", 21],
  ["Baja Verapaz", 8],
  ["Alta Verapaz", 17],
  ["Petén", 14],
  ["Izabal", 5],
  ["Zacapa", 11],
  ["Chiquimula", 11],
  ["Jalapa", 7],
  ["Jutiapa", 17],
];

export function gtNitCheck(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (body.charCodeAt(body.length - 1 - i) - 48) * (i + 2);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? "K" : String(c);
}

export const documents: DocumentSpec[] = [
  {
    code: "GT_DPI",
    country: "GT",
    name: "Guatemalan Personal Identification Document",
    localName: "Documento Personal de Identificación / Código Único de Identificación",
    aliases: ["DPI", "CUI"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    checkIndex: 8,
    confidence: "moderate",
    lengths: [13],
    pattern: /^\d{9}(0[1-9]|1\d|2[0-2])(0[1-9]|[12]\d|3[0-3])$/,
    example: "1912345671230", // check digit is index 8; the last four digits are department 12 / municipality 30
    sources: [
      "https://www.renap.gob.gt/",
      "https://learn.sayari.com/interpreting-guatemalan-national-id-numbers/",
      "https://www.congreso.gob.gt/assets/uploads/info_legislativo/decretos/2005/gtdcx90-2005.pdf",
      "https://es.wikipedia.org/wiki/Anexo:Municipios_de_Guatemala",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 5, 4], " "),
    parse(id) {
      const dept = Number(id.slice(9, 11));
      const muni = Number(id.slice(11, 13));
      const entry = GT_DEPARTMENTS[dept - 1];
      if (!entry || muni > entry[1]) return { ok: false, reason: "invalid_range" };
      let sum = 0;
      for (let i = 0; i < 8; i++) sum += (id.charCodeAt(i) - 48) * (i + 2);
      const r = sum % 11;
      if (r === 10 || r !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: { region: id.slice(9, 13), regionName: entry[0], serial: id.slice(0, 8), extra: { municipality: id.slice(11, 13) } },
      };
    },
  },
  {
    code: "GT_NIT",
    country: "GT",
    name: "Guatemalan Tax Identification Number",
    localName: "Número de Identificación Tributaria",
    aliases: ["NIT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    pattern: /^\d{1,12}[\dK]$/,
    example: "12345679",
    sources: ["https://portal.sat.gob.gt/portal/", "https://portal.sat.gob.gt/portal/consulta-cui-nit/"],
    upstream: ["nationid"],
    format: (c) => `${c.slice(0, -1)}-${c.slice(-1)}`,
    parse(id) {
      const body = id.slice(0, -1);
      if (/^(\d)\1*$/.test(body) && body.length > 1) return { ok: false, reason: "invalid_format" };
      if (gtNitCheck(body) !== id[id.length - 1]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "GT_PASAPORTE",
    country: "GT",
    name: "Guatemalan Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9],
    pattern: /^[A-Z0-9]{8,9}$/,
    example: "G12345678",
    sources: ["https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
