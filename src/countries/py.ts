/**
 * Paraguay — cédula de identidad, RUC and passport.
 *
 * CI (Departamento de Identificaciones, Policía Nacional): 6-9 digits, no
 * check digit.
 *
 * RUC (DNIT, formerly SET): base number + "-" + check digit. For natural
 * persons the base is their CI; companies have 8-digit bases starting 80.
 * Check digit ("módulo 11", base 11): weights 2, 3, 4, ... from the
 * rightmost base digit, r = Σ mod 11, check = r > 1 ? 11 - r : 0.
 *
 * Passport: 6-9 alphanumerics, no check digit on the printed number.
 *
 * Improves on upstream: rules match nationid. Some very old RUCs contain a
 * letter (replaced by its ASCII code in DNIT's calculation); that variant is
 * not confirmed by an official source and is still rejected.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** DNIT RUC check digit for the base number. */
export function pyRucCheckDigit(base: string): number {
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += Number(base[base.length - 1 - i]) * (2 + (i % 10));
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
}

export const documents: DocumentSpec[] = [
  {
    code: "PY_CI",
    country: "PY",
    name: "Paraguayan Identity Card Number",
    localName: "Cédula de Identidad",
    aliases: ["CI", "cédula"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [6, 7, 8, 9],
    pattern: /^\d{6,9}$/,
    example: "123456789",
    sources: ["https://www.policianacional.gov.py/", "https://en.wikipedia.org/wiki/Paraguayan_identity_card"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => c.replace(/\B(?=(\d{3})+$)/g, "."),
    parse: (id) => ({ ok: true, data: { serial: id, extra: {} } }),
  },
  {
    code: "PY_RUC",
    country: "PY",
    name: "Paraguayan Taxpayer Registry Number",
    localName: "Registro Único del Contribuyente",
    aliases: ["RUC"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "moderate",
    lengths: [7, 8, 9, 10],
    pattern: /^\d{7,10}$/,
    example: "1234567890",
    sources: [
      "https://www.dnit.gov.py/",
      "https://yo-facturo.com/herramientas/validador-ruc-paraguay/",
      "https://lookuptax.com/docs/de/steuerliche-identifikationsnummer/paraguay-ruc-steuer-id",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, -1)}-${c.slice(-1)}`,
    parse(id) {
      const base = id.slice(0, -1);
      if (pyRucCheckDigit(base) !== Number(id[id.length - 1])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: base, extra: {} } };
    },
  },
  {
    code: "PY_PASAPORTE",
    country: "PY",
    name: "Paraguayan Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8, 9],
    pattern: /^[A-Z0-9]{6,9}$/,
    example: "A12345678",
    sources: ["https://www.policianacional.gov.py/"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
