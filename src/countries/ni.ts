/**
 * Nicaragua — cédula de identidad, RUC and passport.
 *
 * Cédula (Consejo Supremo Electoral), 14 chars `MMM-DDMMYY-NNNNL`:
 * - MMM    municipality of birth.
 * - DDMMYY date of birth (century not encoded; latest past century).
 * - NNNN   correlativo among people born the same day in the same municipality.
 * - L      check letter: the first 13 digits as a number, mod 23, indexes
 *          `ABCDEFGHJKLMNPQRSTUVWXY` (no I, O, Z).
 *
 * RUC (DGI), 14 chars: a person's RUC is their cédula; legal entities get
 * `J` + 13 digits. No published check digit for the entity form.
 *
 * Improves on upstream:
 * - Cédula: nationid checks the format only. We verify the mod-23 check
 *   letter (a community-documented rule we cross-checked against five
 *   cédulas published in official gazettes and the press; all matched),
 *   reject impossible/future birth dates and extract the date of birth.
 * - RUC: nationid only accepts 14 digits or 13 digits + letter; entity RUCs
 *   are issued as `J` + 13 digits (e.g. DGI's J1310000252297-style numbers),
 *   which it rejects. Person RUCs are checked as cédulas.
 */
import { compact } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";
import { birthFields, latestPastYear } from "../core/dates.js";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXY";

export function niCedulaLetter(digits13: string): string {
  let r = 0;
  for (const ch of digits13) r = (r * 10 + (ch.charCodeAt(0) - 48)) % 23;
  return LETTERS[r]!;
}

const CEDULA = /^\d{3}(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{6}[A-HJ-NP-Y]$/;

function parseCedula(id: string, ref: Date): ParseOutcome {
  if (id.startsWith("000")) return { ok: false, reason: "invalid_range" };
  const day = Number(id.slice(3, 5));
  const month = Number(id.slice(5, 7));
  const year = latestPastYear(Number(id.slice(7, 9)), month, day, ref);
  const birth = year === undefined ? undefined : birthFields(year, month, day, ref);
  if (!birth) return { ok: false, reason: "invalid_date" };
  if (niCedulaLetter(id.slice(0, 13)) !== id[13]) return { ok: false, reason: "invalid_checksum" };
  return { ok: true, data: { ...birth, region: id.slice(0, 3), serial: id.slice(9, 13), extra: {} } };
}

const formatCedula = (c: string) => `${c.slice(0, 3)}-${c.slice(3, 9)}-${c.slice(9)}`;

export const documents: DocumentSpec[] = [
  {
    code: "NI_CEDULA",
    country: "NI",
    name: "Nicaraguan Identity Card Number",
    localName: "Cédula de Identidad",
    aliases: ["cédula", "CI"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [14],
    pattern: CEDULA,
    example: "0010101900001N",
    sources: [
      "https://www.cse.gob.ni/",
      "https://gist.github.com/buster95/468e8053d8dc02e98d726a01cc47f061",
      "https://bcn.gob.ni/sites/default/files/cursos_econ_finan/2020/indicadores%20macroeconomicos/Gaceta%20de%20Publicaci%C3%B3n.pdf",
    ],
    upstream: ["nationid"],
    format: formatCedula,
    parse: (id, { referenceDate }) => parseCedula(id, referenceDate),
  },
  {
    code: "NI_RUC",
    country: "NI",
    name: "Nicaraguan Taxpayer Registry Number",
    localName: "Registro Único de Contribuyentes",
    aliases: ["RUC"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [14],
    pattern: /^(\d{13}[A-HJ-NP-Y]|J\d{13}|\d{14})$/,
    example: "J0310000123456",
    sources: ["https://www.dgi.gob.ni/", "https://lookuptax.com/docs/tax-identification-number/nicaragua-tax-id-guide"],
    upstream: ["nationid"],
    format: (c) => (/^\d{13}[A-Z]$/.test(c) ? formatCedula(c) : c),
    parse(id, { referenceDate }) {
      if (/^\d{13}[A-Z]$/.test(id)) {
        if (!CEDULA.test(id)) return { ok: false, reason: "invalid_format" };
        const r = parseCedula(id, referenceDate);
        return r.ok ? { ok: true, data: { ...r.data, extra: { kind: "person" } } } : r;
      }
      return { ok: true, data: { extra: { kind: id[0] === "J" ? "entity" : "legacy" } } };
    },
  },
  {
    code: "NI_PASAPORTE",
    country: "NI",
    name: "Nicaraguan Passport Number",
    localName: "Pasaporte",
    purpose: "passport",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7, 8, 9],
    pattern: /^[A-Z]?\d{7,8}$/,
    example: "C12345678",
    sources: ["https://www.migob.gob.ni/migracion/", "https://en.wikipedia.org/wiki/Nicaraguan_passport"],
    upstream: ["nationid"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
