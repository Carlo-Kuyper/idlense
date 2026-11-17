/**
 * Ghana — Ghana Card PIN and the legacy GRA TIN.
 *
 * GH_PIN, the Ghana Card Personal Identification Number from the National
 * Identification Authority. Since 1 April 2021 it is also the TIN for eligible
 * individuals. Written CCC-NNNNNNNNN-K (15 characters with hyphens):
 * - CCC the ISO 3166 alpha-3 code of the holder's nationality at first
 *       registration (GHA for citizens). The PIN doesn't change if their
 *       nationality later changes, so we report the code in `extra` and don't
 *       infer current citizenship from it. Unknown codes are `invalid_range`.
 * - N   an 8- or 9-digit system-generated number.
 * - K   a check character (digit or letter). NIA uses it internally but
 *       doesn't publish the algorithm, so we don't verify it.
 * The source is the GRA's TIN description submitted to the OECD (an issuer
 * document), so confidence is `high` for this shape-only rule.
 *
 * GH_TIN, the 11-character TIN the Ghana Revenue Authority still issues to
 * organisations and to individuals who can't get a Ghana Card. It has a
 * 3-character prefix, P00 (individuals), C00 (companies registered with the
 * RGD), G00 (government agencies), Q00 (foreign missions and their staff) or
 * V00 (public institutions, trusts, co-operatives, offshore and other entities
 * not registered with the RGD), then 7 digits and a final check character.
 * The prefixes are from the GRA document. LookupTax reports the final
 * character as a digit or X, an apparent mod-11 check whose weights aren't
 * published, so we don't verify it. Confidence `moderate`.
 */
import { toAlpha2 } from "../core/countries.js";
import type { DocumentSpec } from "../core/types.js";

const GRA_TIN_DOC =
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ghana-TIN.pdf";

export const GH_TIN_KIND: Record<string, string> = {
  P: "individual",
  C: "company",
  G: "government",
  Q: "foreign_mission",
  V: "other_institution",
};

export const documents: DocumentSpec[] = [
  {
    code: "GH_PIN",
    country: "GH",
    name: "Ghana Card Personal Identification Number",
    localName: "Ghana Card PIN",
    aliases: ["Ghana Card", "Ghanacard PIN", "NIA PIN", "Non-Citizen Card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [12, 13],
    pattern: /^[A-Z]{3}\d{8,9}[0-9A-Z]$/,
    example: "GHA1234567890",
    sources: [GRA_TIN_DOC, "https://nia.gov.gh/the-ghanacard-introduction/", "https://lookuptax.com/validate/ghana/tin"],
    format: (c) => `${c.slice(0, 3)}-${c.slice(3, -1)}-${c.slice(-1)}`,
    parse(id) {
      const nationality = id.slice(0, 3);
      if (!toAlpha2(nationality)) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: { serial: id.slice(3, -1), extra: { nationalityAtRegistration: nationality } },
      };
    },
  },
  {
    code: "GH_TIN",
    country: "GH",
    name: "Ghana Revenue Authority Taxpayer Identification Number",
    aliases: ["GRA TIN", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^[PCGQV]00\d{7}[0-9X]$/,
    example: "C0001234560",
    sources: [GRA_TIN_DOC, "https://lookuptax.com/validate/ghana/tin"],
    parse(id) {
      return {
        ok: true,
        data: { serial: id.slice(3, 10), extra: { taxpayerType: GH_TIN_KIND[id[0]!]! } },
      };
    },
  },
];
