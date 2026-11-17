/**
 * Colombia — identity, foreigner and tax numbers.
 *
 * - Cédula de ciudadanía (Registraduría Nacional, Decreto 1260/1970): 6-10
 *   digits, no check digit. Adults; recent numbers are 10-digit NUIPs.
 * - Tarjeta de identidad (Registraduría): minors, 10-11 digits, no check digit.
 * - Cédula de extranjería (Migración Colombia): 6-8 digits, no check digit.
 * - PEP, Permiso Especial de Permanencia (Resolución 5797/2017): 15 digits.
 * - PPT, Permiso por Protección Temporal (Decreto 216/2021): 7-11 alnum.
 * - NIT (DIAN, Estatuto Tributario art. 555-1): base + DV. Companies get a
 *   9-digit base (8xx/9xx million); natural persons use their cédula as the
 *   base. DV: Σ digit × (3,7,13,17,19,23,29,37,41,43) from the right,
 *   r = Σ mod 11, DV = r if r < 2 else 11 - r.
 * - Passport (Cancillería): 6-12 alphanumerics, no published structure.
 *
 * Improves on upstream:
 * - idnumbers' "NUIP" (COL) applies the DIAN check digit to cédula-shaped
 *   numbers; the cédula/NUIP has no check digit, so its validator is really
 *   the NIT. We compare it against CO_NIT.
 * - nationid's NIT requires a 9-10 digit base, rejecting the NIT of anyone
 *   whose cédula has 6-8 digits (most adults born before ~1980). We accept
 *   a 6-10 digit base, matching the cédula.
 * - idnumbers' NIT/NUIP accepts all-same-digit placeholders (e.g.
 *   0000000000) when the DV happens to match; rejected as nationid does.
 */
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43];

/** DIAN check digit (DV) for a NIT base of up to 10 digits. */
export function nitCheckDigit(base: string): number | undefined {
  if (!/^\d{1,10}$/.test(base)) return undefined;
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += (base.charCodeAt(base.length - 1 - i) - 48) * DIAN_WEIGHTS[i]!;
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}

/** `1234567890` → `1.234.567.890`. */
const thousands = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const REGISTRADURIA = "https://www.registraduria.gov.co/";
const MIGRACION = "https://www.migracioncolombia.gov.co/";

export const documents: DocumentSpec[] = [
  {
    code: "CO_CC",
    country: "CO",
    name: "Colombian Citizenship Card Number",
    localName: "Cédula de ciudadanía",
    aliases: ["CC", "cédula", "NUIP"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [6, 7, 8, 9, 10],
    pattern: /^\d{6,10}$/,
    example: "1020304050",
    sources: [REGISTRADURIA, "https://en.wikipedia.org/wiki/Colombian_identity_card"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: thousands,
    parse: () => ({ ok: true, data: { citizenship: "citizen", extra: {} } }),
  },
  {
    code: "CO_TI",
    country: "CO",
    name: "Colombian Minor's Identity Card Number",
    localName: "Tarjeta de identidad",
    aliases: ["TI"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10, 11],
    pattern: /^\d{10,11}$/,
    example: "10123456789",
    sources: [REGISTRADURIA],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "citizen", extra: {} } }),
  },
  {
    code: "CO_CE",
    country: "CO",
    name: "Colombian Foreigner Identity Card Number",
    localName: "Cédula de extranjería",
    aliases: ["CE"],
    purpose: "migratory",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8],
    pattern: /^\d{6,8}$/,
    example: "12345678",
    sources: [MIGRACION],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "foreigner", extra: {} } }),
  },
  {
    code: "CO_PEP",
    country: "CO",
    name: "Colombian Special Stay Permit Number",
    localName: "Permiso Especial de Permanencia",
    aliases: ["PEP"],
    purpose: "migratory",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [15],
    pattern: /^\d{15}$/,
    example: "123456789012345",
    sources: [MIGRACION],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "foreigner", extra: {} } }),
  },
  {
    code: "CO_PPT",
    country: "CO",
    name: "Colombian Temporary Protection Permit Number",
    localName: "Permiso por Protección Temporal",
    aliases: ["PPT"],
    purpose: "migratory",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7, 8, 9, 10, 11],
    pattern: /^[A-Z0-9]{7,11}$/,
    example: "12345678901",
    sources: ["https://www.migracioncolombia.gov.co/visas-permisos/permiso-por-proteccion-temporal-ppt"],
    upstream: ["nationid"],
    normalize: compact,
    parse: () => ({ ok: true, data: { citizenship: "foreigner", extra: {} } }),
  },
  {
    code: "CO_NIT",
    country: "CO",
    name: "Colombian Tax Identification Number",
    localName: "Número de Identificación Tributaria",
    aliases: ["NIT", "RUT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [7, 8, 9, 10, 11],
    pattern: /^\d{7,11}$/,
    example: "9001234568",
    sources: [
      "https://www.dian.gov.co/",
      "https://es.wikipedia.org/wiki/N%C3%BAmero_de_Identificaci%C3%B3n_Tributaria",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => `${thousands(c.slice(0, -1))}-${c.slice(-1)}`,
    parse(id) {
      const base = id.slice(0, -1);
      if (/^(\d)\1+$/.test(base)) return { ok: false, reason: "invalid_format" };
      if (nitCheckDigit(base) !== Number(id[id.length - 1])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: base, extra: { checkDigit: Number(id[id.length - 1]) } } };
    },
  },
  {
    code: "CO_PASAPORTE",
    country: "CO",
    name: "Colombian Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8, 9, 10, 11, 12],
    pattern: /^[A-Z0-9]{6,12}$/,
    example: "AB1234567890",
    sources: ["https://www.cancilleria.gov.co/tramites_servicios/pasaportes"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
