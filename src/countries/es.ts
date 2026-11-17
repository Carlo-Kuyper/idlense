/**
 * Spain — DNI, NIE, the K/L/M personal NIFs, company NIF and social
 * security number.
 *
 * ES_DNI — 8 digits + check letter: TRWAGMYFPDXBNJZSQVHLCKE[n mod 23]
 *   (RD 1553/2005). The DNI number is also the person's NIF.
 * ES_NIE — foreigners: X/Y/Z + 7 digits + letter; X→0, Y→1, Z→2 then the
 *   DNI rule (Orden INT/2058/2008). X numbers were issued until July 2008,
 *   then Y, then Z.
 * ES_NIF_KLM — personal NIFs for people without a DNI/NIE (Orden
 *   EHA/451/2008): K Spaniards under 14, L Spaniards living abroad, M
 *   foreigners without a NIE. Letter + 7 digits + DNI letter over the digits.
 * ES_NIF_PJ — legal entities (former CIF): entity-type letter + 7 digits +
 *   control. The first two digits are the province of registration. Control
 *   = Luhn-style r over the 7 digits; a digit for A B E H, a letter
 *   JABCDEFGHI[r] for N P Q R S W, either for the rest.
 * ES_NUSS — número de la Seguridad Social (NAF), 12 digits PP NNNNNNNN CC:
 *   province, sequence, and CC = (PP·10⁸ + NNNNNNNN) mod 97. For sequence
 *   numbers below 10 000 000 the widely used TGSS rule is
 *   (PP·10⁷ + NNNNNNNN) mod 97 instead; we accept either for those.
 *
 * Improves on upstream:
 * - DNI: the all-zero number 00000000T is rejected (never issued);
 *   idnumbers and nationid accept it.
 * - NUSS: nationid only knows the concatenated form, so numbers with a
 *   sequence below 10 000 000 using the TGSS short form were rejected.
 * - New: K/L/M NIFs (neither upstream has them).
 * - Passports are left out: no check digit on the printed number.
 */
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const NIE_PREFIX: Record<string, string> = { X: "0", Y: "1", Z: "2" };
const KLM_KIND: Record<string, string> = { K: "spanish_under_14", L: "spanish_non_resident", M: "foreigner_without_nie" };
const CIF_LETTERS = "JABCDEFGHI";

export const dniLetter = (digits: string) => DNI_LETTERS[Number(digits) % 23]!;

export function cifControl(body7: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    let d = Number(body7[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

const mod97 = (s: string) => {
  let r = 0;
  for (const c of s) r = (r * 10 + Number(c)) % 97;
  return r;
};

/** Accepted NUSS check values for the first 10 digits. */
export function nussChecks(first10: string): number[] {
  const out = [mod97(first10)];
  const seq = Number(first10.slice(2));
  if (seq < 10_000_000) out.push((Number(first10.slice(0, 2)) * 10_000_000 + seq) % 97);
  return out;
}

/** DNI letters: the table never uses I, Ñ, O or U. */
const LETTER = "[A-HJ-NP-TV-Z]";

export const documents: DocumentSpec[] = [
  {
    code: "ES_DNI",
    country: "ES",
    name: "Spanish National Identity Document Number",
    localName: "Documento Nacional de Identidad",
    aliases: ["DNI", "NIF", "DNIe"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: new RegExp(`^\\d{8}${LETTER}$`),
    example: "12345678Z",
    sources: [
      "https://www.boe.es/buscar/act.php?id=BOE-A-2005-21163",
      "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: compact,
    parse(id) {
      if (id.startsWith("00000000")) return { ok: false, reason: "invalid_range" };
      if (dniLetter(id.slice(0, 8)) !== id[8]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { citizenship: "citizen", serial: id.slice(0, 8), extra: {} } };
    },
  },
  {
    code: "ES_NIE",
    country: "ES",
    name: "Spanish Foreigner Identity Number",
    localName: "Número de Identidad de Extranjero",
    aliases: ["NIE", "TIE", "NIF"],
    purpose: "migratory",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: new RegExp(`^[XYZ]\\d{7}${LETTER}$`),
    example: "X1234567L",
    sources: [
      "https://www.boe.es/buscar/doc.php?id=BOE-A-2008-11975",
      "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/",
    ],
    upstream: ["nationid"],
    normalize: compact,
    parse(id) {
      if (dniLetter(NIE_PREFIX[id[0]!]! + id.slice(1, 8)) !== id[8]) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { citizenship: "foreigner", serial: id.slice(1, 8), extra: { prefix: id[0]! } } };
    },
  },
  {
    code: "ES_NIF_KLM",
    country: "ES",
    name: "Spanish Personal Tax Number (K/L/M)",
    localName: "Número de Identificación Fiscal",
    aliases: ["NIF K", "NIF L", "NIF M"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [9],
    pattern: new RegExp(`^[KLM]\\d{7}${LETTER}$`),
    example: "K1234567L",
    sources: [
      "https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580",
      "https://sede.agenciatributaria.gob.es/",
    ],
    normalize: compact,
    parse(id) {
      if (dniLetter(id.slice(1, 8)) !== id[8]) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          citizenship: id[0] === "M" ? "foreigner" : "citizen",
          serial: id.slice(1, 8),
          extra: { kind: KLM_KIND[id[0]!]! },
        },
      };
    },
  },
  {
    code: "ES_NIF_PJ",
    country: "ES",
    name: "Spanish Company Tax Number",
    localName: "NIF de persona jurídica",
    aliases: ["CIF", "NIF", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^[ABCDEFGHJNPQRSUVW]\d{7}[\dA-J]$/,
    example: "A58818501",
    sources: ["https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580", "https://sede.agenciatributaria.gob.es/"],
    upstream: ["nationid"],
    normalize: (s) => {
      const c = compact(s);
      return /^ES[A-Z]\d{7}[\dA-Z]$/.test(c) ? c.slice(2) : c;
    },
    parse(id) {
      const type = id[0]!;
      const r = cifControl(id.slice(1, 8));
      const given = id[8]!;
      const digitOk = given === String(r);
      const letterOk = given === CIF_LETTERS[r];
      const ok = "ABEH".includes(type) ? digitOk : "NPQRSW".includes(type) ? letterOk : digitOk || letterOk;
      if (!ok) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { region: id.slice(1, 3), serial: id.slice(3, 8), extra: { entityType: type } } };
    },
  },
  {
    code: "ES_NUSS",
    country: "ES",
    name: "Spanish Social Security Number",
    localName: "Número de la Seguridad Social",
    aliases: ["NUSS", "NSS", "NAF", "número de afiliación"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: /^\d{12}$/,
    example: "281234567840",
    sources: ["https://portal.seg-social.gob.es/", "https://www.seg-social.es/"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 8, 2], "/"),
    parse(id) {
      if (!nussChecks(id.slice(0, 10)).includes(Number(id.slice(10)))) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { region: id.slice(0, 2), serial: id.slice(2, 10), extra: {} } };
    },
  },
];
