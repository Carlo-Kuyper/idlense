/**
 * Argentina — DNI and the ARCA (ex-AFIP) / ANSES tax and labour keys.
 *
 * - DNI (RENAPER): 7-8 digits, no check digit. Numbers from 70,000,000 go to
 *   newborns since 2023; the 60 million block was used for foreigners'
 *   CUIT/CUIL in 2019.
 * - CUIT / CUIL / CDI: 11 digits PP NNNNNNNN V. PP is the type prefix, the
 *   8-digit body is the DNI for natural persons (zero-padded), V is a mod-11
 *   check digit with weights 5,4,3,2,7,6,5,4,3,2 (11 → 0; 10 is never issued:
 *   ARCA changes the prefix to 23 or 33 instead).
 *   - Natural persons: 20, 23, 24, 27. Since Resolución General Conjunta
 *     AFIP-ANSES 5007/2021 the prefix is assigned at random and carries no
 *     sex/gender, so we never infer gender from it.
 *   - Legal entities (CUIT only): 30, 33, 34.
 *   - nationid also accepts 25 and 26 for CUIT; kept, unverified.
 * - CDI (Clave de Identificación) for people without CUIT/CUIL. RG 5007/2021
 *   lists it among the person keys with the same 20/23/24/27 prefixes. ARCA
 *   RG 5803/2025 replaced the CDI request with a digital CUIT, so it's marked
 *   deprecated.
 * - Passport: 8-9 alphanumerics, no check digit on the printed number.
 *
 * Improves on upstream:
 * - idnumbers' DNI requires exactly 8 digits; 7-digit DNIs (holders with
 *   numbers below 10,000,000) are valid.
 * - nationid's CDI only accepts prefix 50, which no ARCA source supports;
 *   RG 5007/2021 assigns CDIs the natural-person prefixes 20/23/24/27.
 * - CUIT/CUIL bodies of all zeros are rejected (`invalid_range`).
 * - Extracts the DNI embedded in person CUIT/CUIL/CDI and whether a CUIT
 *   belongs to a person or an entity.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Check digit for the first 10 digits, or undefined when it would be 10 (never issued). */
export function cuitCheckDigit(first10: string): number | undefined {
  const dv = 11 - (weightedSum(first10, W) % 11);
  if (dv === 11) return 0;
  if (dv === 10) return undefined;
  return dv;
}

export const PERSON_PREFIXES = ["20", "23", "24", "27"];
export const CUIT_PERSON_PREFIXES = [...PERSON_PREFIXES, "25", "26"];
export const ENTITY_PREFIXES = ["30", "33", "34"];

function parseKey(id: string, prefixes: readonly string[]): ParseOutcome {
  const prefix = id.slice(0, 2);
  if (!prefixes.includes(prefix)) return { ok: false, reason: "invalid_range" };
  const body = id.slice(2, 10);
  if (/^0+$/.test(body)) return { ok: false, reason: "invalid_range" };
  if (cuitCheckDigit(id.slice(0, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
  const entity = ENTITY_PREFIXES.includes(prefix);
  const extra: Record<string, string | boolean> = { prefix, kind: entity ? "entity" : "person" };
  if (!entity) extra.dni = String(Number(body));
  return { ok: true, data: { serial: body, extra } };
}

const fmtKey = (c: string) => `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`;
const ARCA = "https://www.arca.gob.ar/";
const RG_5007 = "https://www.boletinoficial.gob.ar/detalleAviso/primera/245517/20210610";

export const documents: DocumentSpec[] = [
  {
    code: "AR_DNI",
    country: "AR",
    name: "Argentine National Identity Document",
    localName: "Documento Nacional de Identidad",
    aliases: ["DNI"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [7, 8],
    pattern: /^[1-9]\d{6,7}$/,
    example: "30123456",
    sources: ["https://www.argentina.gob.ar/dni", "https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)"],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => c.replace(/\B(?=(\d{3})+$)/g, "."),
    parse: (id) => ({ ok: true, data: { serial: id, extra: {} } }),
  },
  {
    code: "AR_CUIT",
    country: "AR",
    name: "Argentine Tax Identification Code",
    localName: "Clave Única de Identificación Tributaria",
    aliases: ["CUIT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^(2[0-7]|3[034])\d{9}$/,
    example: "20123456786",
    sources: [ARCA, RG_5007, "https://www.argentina.gob.ar/servicio/obtener-el-cuit"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: fmtKey,
    parse: (id) => parseKey(id, [...CUIT_PERSON_PREFIXES, ...ENTITY_PREFIXES]),
  },
  {
    code: "AR_CUIL",
    country: "AR",
    name: "Argentine Labour Identification Code",
    localName: "Código Único de Identificación Laboral",
    aliases: ["CUIL"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^2[0347]\d{9}$/,
    example: "20123456786",
    sources: ["https://www.anses.gob.ar/consulta/constancia-de-cuil", RG_5007],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: fmtKey,
    parse: (id) => parseKey(id, PERSON_PREFIXES),
  },
  {
    code: "AR_CDI",
    country: "AR",
    name: "Argentine Identification Key",
    localName: "Clave de Identificación",
    aliases: ["CDI"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    deprecated: true,
    lengths: [11],
    pattern: /^2[0347]\d{9}$/,
    example: "27123456780",
    sources: [
      "https://www.argentina.gob.ar/servicio/obtener-la-clave-de-identificacion-cdi",
      RG_5007,
      "https://www.argentina.gob.ar/normativa/nacional/421823/texto",
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: fmtKey,
    parse: (id) => parseKey(id, PERSON_PREFIXES),
  },
  {
    code: "AR_PASAPORTE",
    country: "AR",
    name: "Argentine Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9],
    pattern: /^[A-Z0-9]{8,9}$/,
    example: "AAA123456",
    sources: ["https://www.argentina.gob.ar/interior/pasaporte", "https://en.wikipedia.org/wiki/Argentine_passport"],
    upstream: ["nationid"],
    normalize: compact,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
