/**
 * Uruguay — cédula de identidad, RUT and passport.
 *
 * CI (DNIC): 7 digits + check digit, written 1.234.567-2. Numbers below
 * 1,000,000 are zero-padded to 8 digits here. Check digit: weights
 * 2,9,8,7,6,3,4 over the 7 digits, check = (10 - Σ mod 10) mod 10.
 *
 * RUT (DGI): 12 digits, AA BBBBBB 001 D (DGI's OECD TIN sheet: a 2-digit
 * registration prefix, 6 sequential digits, then always 001 + check digit).
 * Check digit: Σ digit·(4,3,2,9,8,7,6,5,4,3,2) over the first 11 digits,
 * c = 11 - Σ mod 11; 11 → 0; 10 is never issued. DGI declined to publish the
 * algorithm (access-to-information request 2024-5-1-0002222), so it is
 * cross-checked against public-sector RUTs printed in official documents
 * (Intendencia de Montevideo 21 176335 0018, and others).
 *
 * Passport: 1 letter + 6 digits, no check digit on the printed number.
 *
 * Improves on upstream:
 * - nationid applies the RUT weights in reverse order (the rightmost body
 *   digit gets 4, so effectively 2,3,4,5,6,7,8,9,2,3,4 left to right), and it
 *   maps remainder 1 to check digit 1. Real RUTs such as 211763350018 fail
 *   its check; we use the left-to-right weights and treat remainder 1
 *   (c = 10) as unissued.
 * - The RUT's fixed "001" block, a non-zero sequence and the 01-22 prefix are
 *   enforced (nationid accepts any 12 digits with a matching check digit).
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** DNIC cédula check digit for the 7-digit body. */
export function uyCiCheckDigit(body7: string): number {
  return (10 - (weightedSum(body7, [2, 9, 8, 7, 6, 3, 4]) % 10)) % 10;
}

/** DGI RUT check digit for the first 11 digits; 10 means no valid digit. */
export function uyRutCheckDigit(body11: string): number {
  const c = 11 - (weightedSum(body11, [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11);
  return c === 11 ? 0 : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "UY_CI",
    country: "UY",
    name: "Uruguayan Identity Card Number",
    localName: "Cédula de Identidad",
    aliases: ["CI", "cédula"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "12345672",
    sources: [
      "https://www.gub.uy/ministerio-interior/direccion-nacional-identificacion-civil",
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Uruguay-TIN.pdf",
      "https://es.wikipedia.org/wiki/C%C3%A9dula_de_identidad_(Uruguay)",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c[0]}.${c.slice(1, 4)}.${c.slice(4, 7)}-${c[7]}`,
    parse(id) {
      if (uyCiCheckDigit(id) !== Number(id[7])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(0, 7), extra: {} } };
    },
  },
  {
    code: "UY_RUT",
    country: "UY",
    name: "Uruguayan Taxpayer Registry Number",
    localName: "Registro Único Tributario",
    aliases: ["RUT", "RUC"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: /^(0[1-9]|1\d|2[0-2])\d{6}001\d$/,
    example: "211763350018",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Uruguay-TIN.pdf",
      "https://www.gub.uy/ministerio-economia-finanzas/sites/ministerio-economia-finanzas/files/2024-04/Expediente-2024-5-1-0002222%20Francisco%20Xavier.pdf",
      "https://www.dgi.gub.uy/",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 2)}-${c.slice(2, 8)}-${c.slice(8, 11)}-${c[11]}`,
    parse(id) {
      if (id.slice(2, 8) === "000000") return { ok: false, reason: "invalid_format" };
      if (uyRutCheckDigit(id) !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(2, 8), extra: { prefix: id.slice(0, 2) } } };
    },
  },
  {
    code: "UY_PASAPORTE",
    country: "UY",
    name: "Uruguayan Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7],
    pattern: /^[A-Z]\d{6}$/,
    example: "B123456",
    sources: ["https://www.gub.uy/ministerio-interior/direccion-nacional-identificacion-civil"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
