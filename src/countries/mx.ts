/**
 * Mexico — CURP, RFC (personas físicas and morales), IMSS NSS, INE clave de
 * elector and passport.
 *
 * CURP (RENAPO), 18 chars: AAAA YYMMDD S EE CCC H V
 * - AAAA  initials; the 2nd is the first internal vowel of the first surname
 *         (X when there is none or when the four letters spell an
 *         "inconvenient" word).
 * - YYMMDD date of birth. The century is in H: a digit for births up to
 *         1999, a letter from 2000.
 * - S     sex: H (hombre), M (mujer), X (non-binary, issued by RENAPO since 2022).
 * - EE    state of birth (32 entidades + NE, born abroad).
 * - CCC   first internal consonants of surnames and given name (X if none).
 * - V     check digit: Σ value·(18−i) over the 17-char body with the alphabet
 *         0-9 A-N Ñ O-Z (0..36), check = (10 − Σ mod 10) mod 10.
 *
 * RFC (SAT): persona física 13 chars (4 letters + YYMMDD + homoclave of 3),
 * persona moral 12 chars (3 letters + YYMMDD + 3). Check char: Σ value·(13−i)
 * over the first 12 chars (moral numbers are left-padded with a space), SAT
 * value table 0-9 → 0-9, A-N → 10-23, & → 24, O-Z → 25-36, space → 37,
 * Ñ → 38; check = 11 − Σ mod 11 with 11 → 0 and 10 → A.
 *
 * NSS (IMSS), 11 digits: subdelegación (2), year of affiliation (2), year of
 * birth (2), folio (4), Luhn check digit.
 *
 * Clave de elector (INE), 18 chars: 6 consonants from the names, YYMMDD date
 * of birth, 2-digit entidad of birth (INEGI 01-32), sex H/M/X, 3-digit
 * homoclave. No check digit.
 *
 * Improves on upstream:
 * - CURP: rejects impossible dates (Feb 30) and future births; derives the
 *   century from the homoclave (nationid validates no date beyond 01-31);
 *   accepts the non-binary sex marker X (nationid rejects it); requires a
 *   vowel/X in position 2 and consonants/X in positions 14-16 per RENAPO.
 * - RFC: rejects impossible and future dates (nationid only checks day ≤ 31).
 * - Clave de elector: nationid reads the middle digits as YY EE MM DD; INE's
 *   layout is YY MM DD EE (birth date, then entidad), so nationid rejects
 *   every clave for someone born after the 12th of a month. Accepts sex X.
 * - NSS: unchanged (Luhn), plus the extraction of its parts.
 */
import { luhnValid } from "../core/algorithms.js";
import { birthFields, isoDate, latestPastYear } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ExtractedData, Gender, ParseOutcome } from "../core/types.js";

/** RENAPO two-letter state codes (Instructivo Normativo para la asignación de la CURP). */
export const MX_CURP_STATES: Record<string, string> = {
  AS: "Aguascalientes",
  BC: "Baja California",
  BS: "Baja California Sur",
  CC: "Campeche",
  CL: "Coahuila",
  CM: "Colima",
  CS: "Chiapas",
  CH: "Chihuahua",
  DF: "Ciudad de México",
  DG: "Durango",
  GT: "Guanajuato",
  GR: "Guerrero",
  HG: "Hidalgo",
  JC: "Jalisco",
  MC: "Estado de México",
  MN: "Michoacán",
  MS: "Morelos",
  NT: "Nayarit",
  NL: "Nuevo León",
  OC: "Oaxaca",
  PL: "Puebla",
  QT: "Querétaro",
  QR: "Quintana Roo",
  SP: "San Luis Potosí",
  SL: "Sinaloa",
  SR: "Sonora",
  TC: "Tabasco",
  TS: "Tamaulipas",
  TL: "Tlaxcala",
  VZ: "Veracruz",
  YN: "Yucatán",
  ZS: "Zacatecas",
  NE: "Nacido en el extranjero",
};

/** INEGI numeric state codes, used by INE in the clave de elector. */
export const MX_INEGI_STATES: readonly string[] = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Coahuila",
  "Colima",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Estado de México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const SEX: Record<string, Gender | undefined> = { H: "male", M: "female", X: undefined };

const CURP_ALPHABET = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

export function curpCheckDigit(body17: string): number | undefined {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = CURP_ALPHABET.indexOf(body17[i] ?? "?");
    if (v < 0) return undefined;
    sum += v * (18 - i);
  }
  return (10 - (sum % 10)) % 10;
}

const RFC_ALPHABET = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

/** SAT RFC check character for a 12-char body (moral RFCs padded with a leading space). */
export function rfcCheckChar(body12: string): string | undefined {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const v = RFC_ALPHABET.indexOf(body12[i] ?? "?");
    if (v < 0) return undefined;
    sum += v * (13 - i);
  }
  const c = 11 - (sum % 11);
  return c === 11 ? "0" : c === 10 ? "A" : String(c);
}

/** SAT "palabras inconvenientes": the 4th letter is replaced by X, so the raw word never appears. */
const RFC_FORBIDDEN = new Set(
  (
    "BACA BAKA BUEI BUEY CACA CACO CAGA CAGO CAKA CAKO COGE COGI COJA COJE COJI COJO COLA CULO FALO FETO " +
    "GETA GUEI GUEY JETA JOTO KACA KACO KAGA KAGO KAKA KAKO KOGE KOGI KOJA KOJE KOJI KOJO KOLA KULO LILO " +
    "LOCA LOCO LOKA LOKO MAME MAMO MEAR MEAS MEON MIAR MION MOCO MOKO MULA MULO NACA NACO PEDA PEDO PENE " +
    "PIPI PITO POPO PUTA PUTO QULO RATA ROBA ROBE ROBO RUIN SENO TETA VACA VAGA VAGO VAKA VUEI VUEY WUEI WUEY"
  ).split(" "),
);

const RFC_GENERIC = new Set(["XAXX010101000", "XEXX010101000"]);

/** compact() plus the Ñ, which only ASCII-uppercasing would miss. */
const normalizeRfc = (input: string) => compact(input).replace(/ñ/g, "Ñ");

function yymmdd(s: string, ref: Date): { year: number; month: number; day: number } | undefined {
  const yy = Number(s.slice(0, 2));
  const month = Number(s.slice(2, 4));
  const day = Number(s.slice(4, 6));
  const year = latestPastYear(yy, month, day, ref);
  return year === undefined ? undefined : { year, month, day };
}

function parseRfc(id: string, kind: "pf" | "pm", ref: Date): ParseOutcome {
  if (kind === "pf" && RFC_GENERIC.has(id)) return { ok: true, data: { extra: { generic: true } } };
  const n = kind === "pf" ? 4 : 3;
  if (kind === "pf" && RFC_FORBIDDEN.has(id.slice(0, 4))) return { ok: false, reason: "invalid_format" };
  const date = yymmdd(id.slice(n, n + 6), ref);
  if (!date) return { ok: false, reason: "invalid_date" };
  const body = kind === "pf" ? id.slice(0, 12) : " " + id.slice(0, 11);
  if (rfcCheckChar(body) !== id[id.length - 1]) return { ok: false, reason: "invalid_checksum" };
  const homoclave = id.slice(n + 6);
  if (kind === "pf") {
    return { ok: true, data: { ...birthFields(date.year, date.month, date.day, ref)!, extra: { homoclave } } };
  }
  return { ok: true, data: { extra: { homoclave, incorporationDate: isoDate(date.year, date.month, date.day) } } };
}

const DATE = "\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])";
const CONSONANT = "[B-DF-HJ-NP-TV-Z]";

export const documents: DocumentSpec[] = [
  {
    code: "MX_CURP",
    country: "MX",
    name: "Mexican Unique Population Registry Code",
    localName: "Clave Única de Registro de Población",
    aliases: ["CURP"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [18],
    pattern: new RegExp(`^[A-Z][AEIOUX][A-Z]{2}${DATE}[HMX][A-Z]{2}${CONSONANT}{3}[0-9A-Z]\\d$`),
    example: "GOMC850315HDFRRR07",
    sources: [
      "https://www.gob.mx/curp/",
      "https://www.dof.gob.mx/nota_detalle.php?codigo=5366011&fecha=18/10/2014",
      "https://en.wikipedia.org/wiki/Unique_Population_Registry_Code",
    ],
    upstream: ["nationid", "idnumbers"],
    parse(id, { referenceDate }) {
      const state = id.slice(11, 13);
      const regionName = MX_CURP_STATES[state];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      const century = /\d/.test(id[16]!) ? 1900 : 2000;
      const birth = birthFields(century + Number(id.slice(4, 6)), Number(id.slice(6, 8)), Number(id.slice(8, 10)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (curpCheckDigit(id.slice(0, 17)) !== Number(id[17])) return { ok: false, reason: "invalid_checksum" };
      const sex = id[10]!;
      const data: Omit<ExtractedData, "age"> = {
        ...birth,
        region: state,
        regionName,
        serial: id[16],
        extra: { sex },
      };
      const gender = SEX[sex];
      if (gender) data.gender = gender;
      return { ok: true, data };
    },
  },
  {
    code: "MX_RFC_PF",
    country: "MX",
    name: "Mexican Federal Taxpayer Registry (individuals)",
    localName: "RFC persona física",
    aliases: ["RFC"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [13],
    pattern: new RegExp(`^[A-ZÑ&]{4}${DATE}[A-Z0-9]{2}[0-9A]$`),
    example: "PEMJ800101AB6",
    sources: [
      "https://www.sat.gob.mx/consultas/44083/consulta-tu-informacion-fiscal",
      "https://www.sat.gob.mx/normatividad/58917/resolucion-miscelanea-fiscal-",
      "https://es.wikipedia.org/wiki/Registro_Federal_de_Contribuyentes",
    ],
    upstream: ["nationid"],
    normalize: normalizeRfc,
    parse: (id, { referenceDate }) => parseRfc(id, "pf", referenceDate),
  },
  {
    code: "MX_RFC_PM",
    country: "MX",
    name: "Mexican Federal Taxpayer Registry (companies)",
    localName: "RFC persona moral",
    aliases: ["RFC"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [12],
    pattern: new RegExp(`^[A-ZÑ&]{3}${DATE}[A-Z0-9]{2}[0-9A]$`),
    example: "ABC010203XYA",
    sources: [
      "https://www.sat.gob.mx/normatividad/58917/resolucion-miscelanea-fiscal-",
      "https://es.wikipedia.org/wiki/Registro_Federal_de_Contribuyentes",
    ],
    upstream: ["nationid"],
    normalize: normalizeRfc,
    parse: (id, { referenceDate }) => parseRfc(id, "pm", referenceDate),
  },
  {
    code: "MX_NSS",
    country: "MX",
    name: "Mexican Social Security Number",
    localName: "Número de Seguridad Social",
    aliases: ["NSS", "IMSS number"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^\d{11}$/,
    example: "12345678903",
    sources: ["https://www.imss.gob.mx/tramites/imss02008", "https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/asignacionNSS"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse(id) {
      if (/^(\d)\1+$/.test(id)) return { ok: false, reason: "invalid_format" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          region: id.slice(0, 2),
          serial: id.slice(6, 10),
          extra: { affiliationYear2: id.slice(2, 4), birthYear2: id.slice(4, 6) },
        },
      };
    },
  },
  {
    code: "MX_CLAVE_ELECTOR",
    country: "MX",
    name: "Mexican Voter Key",
    localName: "Clave de Elector",
    aliases: ["INE", "IFE", "credencial para votar"],
    purpose: "voter",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [18],
    // 6 letters, YYMMDD, entidad 01-32, sex, 3 digits
    pattern: new RegExp(`^[A-Z]{6}${DATE}(0[1-9]|[12]\\d|3[0-2])[HMX]\\d{3}$`),
    example: "GMRPRZ85091009H123",
    sources: [
      "https://ayudarepresentantes.ine.mx/pel-2025/materiales/MaterialCap_CredElector.pdf",
      "https://www.ine.mx/credencial/",
    ],
    upstream: ["nationid"],
    parse(id, { referenceDate }) {
      const date = yymmdd(id.slice(6, 12), referenceDate);
      if (!date) return { ok: false, reason: "invalid_date" };
      const region = id.slice(12, 14);
      const sex = id[14]!;
      const data: Omit<ExtractedData, "age"> = {
        ...birthFields(date.year, date.month, date.day, referenceDate)!,
        region,
        regionName: MX_INEGI_STATES[Number(region) - 1],
        serial: id.slice(15),
        extra: { sex },
      };
      const gender = SEX[sex];
      if (gender) data.gender = gender;
      return { ok: true, data };
    },
  },
  {
    code: "MX_PASAPORTE",
    country: "MX",
    name: "Mexican Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^[A-Z]\d{8}$/,
    example: "G12345678",
    sources: ["https://www.gob.mx/sre", "https://en.wikipedia.org/wiki/Mexican_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
