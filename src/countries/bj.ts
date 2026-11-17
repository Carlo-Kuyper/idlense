/**
 * Benin — IFU (Identifiant Fiscal Unique), Décret 2006-201: 13 digits, "dont le
 * dernier est le chiffre clé". Issued by the DGI to persons and entities.
 * Layout as documented by org-id.guide from DGI material:
 * - T     taxpayer type: 1 individual (male), 2 individual (female),
 *         3 company, 4 state body, 5 international organisation / diplomatic
 *         mission, 6 NGO.
 * - YYYY  year of registration (a future year is `invalid_range`).
 * - NNNNNN sequence within that year.
 * - E     1 parent company, 2-9 branch or agency, 0 other taxpayers.
 * - K     check digit. "Créé par un algorithme" that isn't published, so it
 *         isn't verified.
 * Shape-only; length from the decree, segments from one secondary source that
 * cites the DGI: confidence `moderate`.
 *
 * Not covered: the NPI (ANIP personal number). ANIP describes it as
 * deliberately meaningless and we found no source for its length.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec, Gender } from "../core/types.js";

export const BJ_IFU_TYPE: Record<string, string> = {
  "1": "individual",
  "2": "individual",
  "3": "company",
  "4": "state_body",
  "5": "international_organisation",
  "6": "ngo",
};

export const documents: DocumentSpec[] = [
  {
    code: "BJ_IFU",
    country: "BJ",
    name: "Beninese Single Tax Identifier",
    localName: "Identifiant Fiscal Unique",
    aliases: ["IFU"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    pattern: /^[1-6](19|20)\d{10}$/,
    example: "3200901353510",
    sources: [
      "https://sgg.gouv.bj/doc/decret-2006-201/download",
      "https://org-id.guide/list/BJ-IFU",
      "https://impots.finances.gouv.bj/wp-content/uploads/2016/12/IFU.pdf",
    ],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const year = Number(id.slice(1, 5));
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_range" };
      const e = id[11]!;
      const gender: Gender | undefined = id[0] === "1" ? "male" : id[0] === "2" ? "female" : undefined;
      return {
        ok: true,
        data: {
          ...(gender ? { gender } : {}),
          serial: id.slice(5, 11),
          extra: {
            taxpayerType: BJ_IFU_TYPE[id[0]!]!,
            registrationYear: year,
            establishment: e === "1" ? "parent" : e === "0" ? "other" : "branch",
          },
        },
      };
    },
  },
];
