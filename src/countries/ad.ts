/**
 * Andorra — Número de Registre Tributari (NRT), the tax register number
 * (Llei 21/2014, art. 26; Reglament de gestió tributària of 11 February 2015,
 * arts. 13-17).
 *
 * Shape, per the Andorran government's TIN sheet on the OECD AEOI portal:
 * one letter, six digits, one control letter, written `F-123456-Z`.
 *
 * - F  resident individual; the six digits are the person's NIA
 *      (Número d'Identificació Administrativa). Range 000000-699999.
 * - E  non-resident individual (NIA 800000-999999) or non-resident legal
 *      entity (any range). We can't tell the two apart from the number.
 * - A  societat anònima, 700000-799999.
 * - L  societat limitada, 700000-799999.
 * - C  comunitats de béns · D public bodies · G tax groups · O collective
 *      investment schemes · P associations/foundations · U parapublic entities.
 *
 * The control letter's algorithm isn't published, so this is a shape check
 * (checksum: false). Numbers outside the documented range for F, A and L are
 * `invalid_range`.
 *
 * No upstream library has it.
 */
import { group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const HOLDER_TYPES: Record<string, string> = {
  F: "resident_individual",
  E: "non_resident",
  A: "societat_anonima",
  L: "societat_limitada",
  C: "comunitat_de_bens",
  D: "public_body",
  G: "tax_group",
  O: "collective_investment_scheme",
  P: "association_or_foundation",
  U: "parapublic_entity",
};

export const documents: DocumentSpec[] = [
  {
    code: "AD_NRT",
    country: "AD",
    name: "Andorran Tax Register Number",
    localName: "Número de Registre Tributari",
    aliases: ["NRT", "NIA", "Número d'Identificació Administrativa"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [8],
    pattern: /^[ACDEFGLOPU]\d{6}[A-Z]$/,
    example: "F123456Z",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/andorra-tin.pdf",
      "https://www.bopa.ad/bopa/027013/Documents/ga27013015.pdf",
    ],
    format: (c) => group(c, [1, 6, 1], "-"),
    parse(id) {
      const prefix = id[0]!;
      const n = Number(id.slice(1, 7));
      if (prefix === "F" && n > 699999) return { ok: false, reason: "invalid_range" };
      if ((prefix === "A" || prefix === "L") && (n < 700000 || n > 799999)) {
        return { ok: false, reason: "invalid_range" };
      }
      return {
        ok: true,
        data: {
          ...(prefix === "F" ? { citizenship: "resident" } : {}),
          serial: id.slice(1, 7),
          extra: { holderType: HOLDER_TYPES[prefix]!, controlLetter: id[7]! },
        },
      };
    },
  },
];
