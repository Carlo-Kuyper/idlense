/**
 * Ecuador — cédula de identidad, RUC and passport.
 *
 * Cédula (10 digits): PP T SSSSSS C
 * - PP     province of registration, 01-24, or 30 for Ecuadorians registered
 *          abroad (consulates).
 * - T      0-5 for natural persons (6 and 9 are RUC markers for entities).
 * - C      Luhn-style check digit: weights 2,1,2,1,... over the first 9
 *          digits, products > 9 minus 9, (10 - Σ mod 10) mod 10.
 *
 * RUC (13 digits), SRI (Reglamento a la Ley del RUC art. 3, as summarised
 * in SRI's OECD TIN sheet): the third digit picks the layout, and the last
 * three digits are always 001.
 * - 0-5  natural person: the holder's cédula (10 digits) + 001.
 * - 6    public entity: 8 digits + mod-11 check digit at position 9
 *        (weights 3,2,7,6,5,4,3,2) + 0 + 001.
 * - 9    private company / non-resident foreigner: 9 digits + mod-11 check
 *        digit at position 10 (weights 4,3,2,7,6,5,4,3,2) + 001.
 *   mod 11: r = Σ mod 11, check = r ? 11 - r : 0 (10 never issued).
 * - 7, 8 are not issued.
 *
 * The SRI says RUCs of private companies (type 9) and public bodies (type 6)
 * have no fixed check algorithm (lookuptax.com's Ecuador guide, citing
 * sri.gob.ec): real RUCs exist that fail the mod-11 rule above. So types 6/9
 * are accepted either way and the mod-11 result is reported as
 * `extra.checkDigitValid`. Natural-person RUCs keep the strict cédula check.
 *
 * Contract choice: `checksum` stays true, because the natural-person layout
 * (the majority of RUCs) is fully check-digit verified. The spec's example is
 * a natural-person RUC with `checkIndex: 9` (the cédula check digit), so the
 * contract's mutation test exercises a real check. `identify()` reads
 * `extra.checkDigitValid: false` as "not verified": the match reports
 * `checksumVerified: false`, and such a number is not used as evidence when
 * guessing the country.
 *
 * Passport: Andean Community booklet; the printed number has no check digit.
 *
 * Improves on upstream:
 * - nationid accepts any RUC suffix 001-999 (reading it as an establishment
 *   number); SRI states the RUC always ends in 001 (branches are numbered
 *   separately on invoices), so other suffixes are rejected (invalid_format).
 * - nationid rejects type 6/9 RUCs that fail mod 11; the SRI says those types
 *   have no fixed check algorithm, so we accept them and report
 *   `extra.checkDigitValid`.
 * - Extracts the province (with name) and the RUC kind.
 * - idnumbers narrows the third digit to 4-5 for province 30 based on a
 *   MINTEL issue thread; the Registro Civil publishes no such rule and
 *   nationid/other validators accept 0-5, so we keep 0-5.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

/** Province codes (Registro Civil; INEC's DPA codes use the same numbering). */
export const EC_PROVINCES: Record<string, string> = {
  "01": "Azuay",
  "02": "Bolívar",
  "03": "Cañar",
  "04": "Carchi",
  "05": "Cotopaxi",
  "06": "Chimborazo",
  "07": "El Oro",
  "08": "Esmeraldas",
  "09": "Guayas",
  "10": "Imbabura",
  "11": "Loja",
  "12": "Los Ríos",
  "13": "Manabí",
  "14": "Morona Santiago",
  "15": "Napo",
  "16": "Pastaza",
  "17": "Pichincha",
  "18": "Tungurahua",
  "19": "Zamora Chinchipe",
  "20": "Galápagos",
  "21": "Sucumbíos",
  "22": "Orellana",
  "23": "Santo Domingo de los Tsáchilas",
  "24": "Santa Elena",
  "30": "Exterior (consular registration)",
};

/** Cédula check digit over the first 9 digits. */
export function ecCedulaCheckDigit(body9: string): number {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = Number(body9[i]) * (i % 2 === 0 ? 2 : 1);
    if (p > 9) p -= 9;
    sum += p;
  }
  return (10 - (sum % 10)) % 10;
}

const mod11 = (body: string, weights: readonly number[]): number => {
  const r = weightedSum(body, weights) % 11;
  return r === 0 ? 0 : 11 - r;
};

const PROVINCE = "(0[1-9]|1\\d|2[0-4]|30)";
const SOURCES = [
  "https://www.registrocivil.gob.ec/",
  "https://www.sri.gob.ec/",
  "https://en.wikipedia.org/wiki/National_identification_number#Ecuador",
];

function province(id: string) {
  const region = id.slice(0, 2);
  return { region, regionName: EC_PROVINCES[region]! };
}

function parseCedula(id: string): ParseOutcome {
  if (ecCedulaCheckDigit(id) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
  return { ok: true, data: { ...province(id), serial: id.slice(3, 9), extra: {} } };
}

export const documents: DocumentSpec[] = [
  {
    code: "EC_CEDULA",
    country: "EC",
    name: "Ecuadorian Identity Card Number",
    localName: "Cédula de Identidad",
    aliases: ["cédula", "CI"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: new RegExp(`^${PROVINCE}[0-5]\\d{7}$`),
    example: "1710034065",
    sources: SOURCES,
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    parse: (id) => parseCedula(id),
  },
  {
    code: "EC_RUC",
    country: "EC",
    name: "Ecuadorian Taxpayer Registry Number",
    localName: "Registro Único de Contribuyentes",
    aliases: ["RUC"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: new RegExp(`^${PROVINCE}[0-69]\\d{7}001$`),
    // Natural-person RUC: position 9 is the cédula check digit (see header).
    checkIndex: 9,
    example: "1710034065001",
    sources: [
      "https://www.sri.gob.ec/web/intersri/ruc",
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ecuador-TIN.pdf",
      "https://lookuptax.com/docs/tax-identification-number/ecuador-tax-id-guide",
      ...SOURCES,
    ],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse(id): ParseOutcome {
      const t = id[2]!;
      if (t === "6") {
        if (id[9] !== "0") return { ok: false, reason: "invalid_format" };
        // No fixed algorithm for public bodies (SRI): report, don't reject.
        const checkDigitValid = mod11(id, [3, 2, 7, 6, 5, 4, 3, 2]) === Number(id[8]);
        return {
          ok: true,
          data: { ...province(id), serial: id.slice(3, 8), extra: { kind: "public", checkDigitValid } },
        };
      }
      if (t === "9") {
        // No fixed algorithm for private companies (SRI): report, don't reject.
        const checkDigitValid = mod11(id, [4, 3, 2, 7, 6, 5, 4, 3, 2]) === Number(id[9]);
        return {
          ok: true,
          data: { ...province(id), serial: id.slice(3, 9), extra: { kind: "private", checkDigitValid } },
        };
      }
      const r = parseCedula(id.slice(0, 10));
      if (!r.ok) return r;
      return {
        ok: true,
        data: { ...r.data, extra: { kind: "natural", cedula: id.slice(0, 10) } },
      };
    },
  },
  {
    code: "EC_PASAPORTE",
    country: "EC",
    name: "Ecuadorian Passport Number",
    localName: "Pasaporte",
    aliases: ["passport"],
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [8, 9],
    pattern: /^[A-Z0-9]{8,9}$/,
    example: "A12345678",
    sources: ["https://www.cancilleria.gob.ec/", "https://en.wikipedia.org/wiki/Ecuadorian_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
