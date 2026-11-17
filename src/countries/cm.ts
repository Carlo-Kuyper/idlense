/**
 * Cameroon — NIU (Numéro d'Identifiant Unique), the taxpayer number of the
 * Direction Générale des Impôts, for persons and entities.
 *
 * 14 characters: M (legal entity) or P (individual / sole establishment),
 * 12 digits, and a final letter. Several guides agree on the shape and real
 * company NIUs match it. One guide (lefisk.cm) reads the digits as creation
 * month/day + 2-digit year + 8-digit DGI serial, but it contradicts itself
 * for individuals, so we don't extract them. The final letter is a check
 * character from an internal DGI algorithm that isn't published, so it isn't
 * verified. Shape-only; confidence `moderate`.
 *
 * Not covered: the CNI number (no source found).
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "CM_NIU",
    country: "CM",
    name: "Cameroonian Unique Taxpayer Identifier",
    localName: "Numéro d'Identifiant Unique",
    aliases: ["NIU", "numéro contribuable"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [14],
    pattern: /^[MP]\d{12}[A-Z]$/,
    example: "M099600009248R",
    sources: [
      "https://org-id.guide/list/CM-NIU",
      "https://taxdo.com/resources/global-tax-id-validation-guide/cameroon.md",
      "https://lefisk.cm/blog/numero-identifiant-fiscal-cameroun-niu-format-obtention-verification",
    ],
    parse(id) {
      return {
        ok: true,
        data: { extra: { taxpayerType: id[0] === "M" ? "entity" : "individual", checkLetter: id[13]! } },
      };
    },
  },
];
