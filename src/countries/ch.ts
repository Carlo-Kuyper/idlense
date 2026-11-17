/**
 * Switzerland — AHV/AVS social insurance number and the business UID.
 *
 * CH_AHV — AHV-Nummer / numéro AVS / numero AVS (since 2008), 13 digits
 *   `756.NNNN.NNNN.NC`: 756 is Switzerland's ISO 3166 numeric code, the
 *   middle nine digits are random (nothing about the holder is encoded),
 *   and C is an EAN-13 check digit (weights 1,3 from the left).
 *
 * CH_UID — Unternehmens-Identifikationsnummer: `CHE` + 8 digits + check
 *   digit, weights 5,4,3,2,7,6,5,4, mod 11; check = 11 − r (r = 0 → 0); a
 *   remainder of 1 is never issued (BFS, UIDG).
 *
 * CH_MWST — VAT number: the UID followed by `MWST`, `TVA` or `IVA`.
 *
 * Improves on upstream:
 * - idnumbers checks only the shape of the UID (`CHE` + 9 digits); we
 *   verify the BFS check digit, as nationid does.
 */
import { weightedSum } from "../core/algorithms.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function ahvCheckDigit(body12: string): number {
  return (10 - (weightedSum(body12, [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]) % 10)) % 10;
}

/** UID check digit for 8 digits, or undefined when the remainder makes it unissuable. */
export function uidCheckDigit(body8: string): number | undefined {
  const r = weightedSum(body8, [5, 4, 3, 2, 7, 6, 5, 4]) % 11;
  if (r === 1) return undefined;
  return r === 0 ? 0 : 11 - r;
}

const uidFormat = (c: string) => `CHE-${group(c.slice(3, 12), [3, 3, 3], ".")}`;
const uidSources = ["https://www.uid.admin.ch/", "https://www.fedlex.admin.ch/eli/cc/2011/25/de"];

export const documents: DocumentSpec[] = [
  {
    code: "CH_AHV",
    country: "CH",
    name: "Swiss Social Security Number",
    localName: "AHV-Nummer",
    aliases: ["AHV", "AVS", "AVS number", "Sozialversicherungsnummer", "numéro AVS", "AHVN13"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^756\d{10}$/,
    example: "7569217076985",
    sources: [
      "https://www.zas.admin.ch/zas/de/home/partenaires-et-institutions-/navs13.html",
      "https://www.ahv-iv.ch/",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 4, 4, 2], "."),
    parse(id) {
      if (ahvCheckDigit(id.slice(0, 12)) !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { serial: id.slice(3, 12), extra: {} } };
    },
  },
  {
    code: "CH_UID",
    country: "CH",
    name: "Swiss Business Identification Number",
    localName: "Unternehmens-Identifikationsnummer",
    aliases: ["UID", "IDE", "IDI", "Enterprise ID"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [12],
    pattern: /^CHE\d{9}$/,
    example: "CHE109322551",
    sources: uidSources,
    upstream: ["nationid", "idnumbers"],
    normalize: compact,
    format: uidFormat,
    parse(id) {
      const c = uidCheckDigit(id.slice(3, 11));
      if (c === undefined || c !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "CH_MWST",
    country: "CH",
    name: "Swiss VAT Number",
    localName: "MWST-Nummer",
    aliases: ["MWST", "TVA", "IVA", "VAT number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [15, 16],
    pattern: /^CHE\d{9}(MWST|TVA|IVA)$/,
    example: "CHE109322551MWST",
    sources: [...uidSources, "https://www.estv.admin.ch/"],
    upstream: ["nationid"],
    normalize: compact,
    format: (c) => `${uidFormat(c)} ${c.slice(12)}`,
    parse(id) {
      const c = uidCheckDigit(id.slice(3, 11));
      if (c === undefined || c !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: { suffix: id.slice(12) } } };
    },
  },
];
