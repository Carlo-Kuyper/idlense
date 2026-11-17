/**
 * Seychelles — Seychelles Revenue Commission TIN.
 *
 * Nine digits, generated at random by an SRC algorithm that "also ensures
 * that it meets a checksum requirement" (OECD Seychelles TIN sheet). Under
 * s. 35 of the Revenue Administration Act 2009 any "person" liable for
 * revenue (an individual, partnership, entity, trust or government body)
 * must apply for one, so individuals in business get a TIN too. Employees
 * don't: their income tax is withheld under the employer's TIN. The SRC's
 * public register lists e.g. 961900106 for Seychelles Breweries Ltd.
 *
 * The checksum algorithm isn't published, so we check the shape only.
 * Confidence stays `low` because only the shape can be checked.
 *
 * The national identity number isn't modelled: we found no published format.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "SC_TIN",
    country: "SC",
    name: "Seychelles Taxpayer Identification Number",
    aliases: ["TIN", "SRC TIN", "VAT number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "961900106",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Seychelles-TIN.pdf",
      "https://lookuptax.com/validate/seychelles/tin",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
