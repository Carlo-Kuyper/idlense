/**
 * Panama — cédula, RUC and passport. None has a check digit on the number
 * itself.
 *
 * - Cédula de identidad personal (Tribunal Electoral): TIPO-TOMO-ASIENTO,
 *   tomo 1-4 digits, asiento 1-6 digits. The dashes carry meaning (the parts
 *   have variable length), so they are kept in the compact form. TIPO:
 *     1-13     province / comarca of registration (table below)
 *     nAV      registered before the civil registry law took effect ("antes de vigencia")
 *     nPI      indigenous population registration
 *     PE       Panamanian born abroad
 *     E        foreign resident
 *     N        naturalised Panamanian
 * - RUC (DGI): natural persons use their cédula. Legal persons use either
 *   the old TOMO-FOLIO-ASIENTO or, since 2014, FOLIO_REAL-2-YYYY /
 *   FOLIO_REAL-3-YYYY (2 for companies, 3 for foundations / associations).
 *   DGI prints a 2-digit "DV" next to the RUC; its formula is not published,
 *   so a trailing "DV nn" is dropped by `normalize` and not verified.
 * - Passport (Autoridad de Pasaportes): up to 2 letters + 6-8 digits.
 *
 * Improves on upstream:
 * - nationid's RUC rejects the post-2014 Folio Real format
 *   (e.g. 155xxxxxx-2-2019) that DGI now issues to every new company.
 * - nationid drops the "AV" (antes de vigencia) and "PI" (indigenous) cédula
 *   prefixes that its own header lists; we accept them.
 * - Extracts province/comarca and citizenship from the cédula.
 */
import { clean } from "../core/normalize.js";
import type { DocumentSpec, ExtractedData, ParseOutcome } from "../core/types.js";

/** Province / comarca codes of the cédula (Tribunal Electoral). */
export const PA_PROVINCES: Record<string, string> = {
  "1": "Bocas del Toro",
  "2": "Coclé",
  "3": "Colón",
  "4": "Chiriquí",
  "5": "Darién",
  "6": "Herrera",
  "7": "Los Santos",
  "8": "Panamá",
  "9": "Veraguas",
  "10": "Guna Yala",
  "11": "Emberá-Wounaan",
  "12": "Ngäbe-Buglé",
  "13": "Panamá Oeste",
};

/** Keep dashes; drop spaces/dots; drop a trailing DGI "DV nn"; join "8-AV-" → "8AV-". */
export function normalizePA(input: string): string {
  return clean(input)
    .replace(/[\s.]*D\.?V\.?[\s:.-]*\d{1,2}$/, "")
    .replace(/[\s.,_:/()]/g, "")
    .replace(/^(\d{1,2})-?(AV|PI)-/, "$1$2-");
}

const CEDULA = /^(?:(?:[1-9]|1[0-3])(?:AV|PI)?|PE|E|N)-\d{1,4}-\d{1,6}$/;
const RUC_OLD_JURIDICA = /^\d{1,4}-\d{1,4}-\d{1,6}$/;
const RUC_FOLIO_REAL = /^\d{1,10}-[23]-(?:19|20)\d{2}$/;
const LENGTHS = Array.from({ length: 13 }, (_, i) => i + 5); // 5..17

function cedulaData(id: string): Omit<ExtractedData, "age"> {
  const [tipo, tomo, asiento] = id.split("-") as [string, string, string];
  const extra: ExtractedData["extra"] = { tomo, asiento };
  if (tipo === "E") return { citizenship: "foreigner", extra: { ...extra, kind: "foreign_resident" } };
  if (tipo === "N") return { citizenship: "naturalized_citizen", extra: { ...extra, kind: "naturalized" } };
  if (tipo === "PE") return { citizenship: "citizen", extra: { ...extra, kind: "born_abroad" } };
  const m = /^(\d+)(AV|PI)?$/.exec(tipo)!;
  const kind = m[2] === "AV" ? "before_civil_registry" : m[2] === "PI" ? "indigenous" : "province";
  return { citizenship: "citizen", region: m[1]!, regionName: PA_PROVINCES[m[1]!], extra: { ...extra, kind } };
}

export const documents: DocumentSpec[] = [
  {
    code: "PA_CEDULA",
    country: "PA",
    name: "Panamanian Identity Card Number",
    localName: "Cédula de identidad personal",
    aliases: ["cédula"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: LENGTHS,
    pattern: CEDULA,
    example: "8-1234-123456",
    sources: [
      "https://www.tribunal-electoral.gob.pa/",
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/panama-tin.pdf",
    ],
    upstream: ["nationid"],
    normalize: normalizePA,
    parse: (id) => ({ ok: true, data: cedulaData(id) }),
  },
  {
    code: "PA_RUC",
    country: "PA",
    name: "Panamanian Taxpayer Number",
    localName: "Registro Único de Contribuyentes",
    aliases: ["RUC"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: LENGTHS,
    pattern: /^(?:(?:(?:[1-9]|1[0-3])(?:AV|PI)?|PE|E|N)-\d{1,4}-\d{1,6}|\d{1,4}-\d{1,4}-\d{1,6}|\d{1,10}-[23]-(?:19|20)\d{2})$/,
    example: "PE-1234-123456",
    sources: ["https://dgi.mef.gob.pa/Preguntas/ruc", "https://dgi.mef.gob.pa/Dv"],
    upstream: ["nationid"],
    normalize: normalizePA,
    parse(id, { referenceDate }): ParseOutcome {
      // A numeric TIPO-TOMO-ASIENTO is also a valid old company TOMO-FOLIO-ASIENTO: don't guess.
      if (CEDULA.test(id) && !RUC_OLD_JURIDICA.test(id)) {
        const d = cedulaData(id);
        return { ok: true, data: { ...d, extra: { ...d.extra, holderType: "natural_person" } } };
      }
      if (RUC_FOLIO_REAL.test(id)) {
        const [folio, type, year] = id.split("-") as [string, string, string];
        if (Number(year) > referenceDate.getFullYear()) {
          // Could still be an old TOMO-FOLIO-ASIENTO (e.g. 150-3-2048).
          return RUC_OLD_JURIDICA.test(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_range" };
        }
        return {
          ok: true,
          data: {
            serial: folio,
            extra: { holderType: "legal_person", entityClass: type === "2" ? "company" : "foundation_or_association", registrationYear: Number(year) },
          },
        };
      }
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "PA_PASAPORTE",
    country: "PA",
    name: "Panamanian Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 7, 8, 9, 10],
    pattern: /^[A-Z]{0,2}\d{6,8}$/,
    example: "PA12345678",
    sources: ["https://www.pasaportes.gob.pa/"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
