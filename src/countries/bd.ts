/**
 * Bangladesh — National ID (NID) numbers, issued by the Election Commission.
 * Three lengths are in circulation and all remain valid:
 *
 * - 13 digits (2008 voter-list registration): `DD R PP UU SSSSSS`
 *   DD district code, R area type (1 rural, 2 municipality, 3 city,
 *   4 other, 5 cantonment, 9 city corporation), PP police station (thana),
 *   UU union/ward, SSSSSS serial.
 * - 17 digits (later voter-list updates): the 4-digit birth year followed by
 *   the 13-digit structure.
 * - 10 digits (smart cards, from 2016): random, with a check digit whose
 *   algorithm is not published, so `checksum: false`.
 *
 * None of these has a published check digit. The 13/17-digit structure comes
 * from idnumbers and secondary sources; confidence is low.
 *
 * Ported from idnumbers (BGD).
 *
 * Improves on upstream:
 * - idnumbers accepts any 4-digit birth year in the 17-digit form (0000,
 *   future years); we reject years before 1870 or after the reference date
 *   as `invalid_date` and report `birthYear`.
 * - Adds the 10-digit smart-card NID (`BD_SMART_NID`), which upstream lacks.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const BD_AREA_TYPES: Record<string, string> = {
  "1": "rural",
  "2": "municipality",
  "3": "city",
  "4": "other",
  "5": "cantonment",
  "9": "city_corporation",
};

const SOURCES = [
  "https://services.nidw.gov.bd/",
  "https://en.wikipedia.org/wiki/National_identity_card_(Bangladesh)",
  "https://www.gov.uk/government/publications/bangladesh-country-policy-and-information-notes/country-information-note-documentation-bangladesh-november-2024-accessible",
];

export const documents: DocumentSpec[] = [
  {
    code: "BD_NID",
    country: "BD",
    name: "Bangladesh National ID Number (13/17-digit)",
    localName: "জাতীয় পরিচয়পত্র নম্বর",
    aliases: ["NID", "voter ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [13, 17],
    pattern: /^(?:\d{4})?\d{2}[1-59]\d{10}$/,
    example: "19841592824588424",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      let birthYear: number | undefined;
      const base = id.length === 17 ? id.slice(4) : id;
      if (id.length === 17) {
        birthYear = Number(id.slice(0, 4));
        if (birthYear < 1870 || birthYear > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      }
      return {
        ok: true,
        data: {
          ...(birthYear === undefined ? {} : { birthYear }),
          region: base.slice(0, 2),
          serial: base.slice(7),
          extra: {
            areaType: BD_AREA_TYPES[base[2]!]!,
            policeStation: base.slice(3, 5),
            union: base.slice(5, 7),
          },
        },
      };
    },
  },
  {
    code: "BD_SMART_NID",
    country: "BD",
    name: "Bangladesh Smart Card NID Number",
    localName: "স্মার্ট জাতীয় পরিচয়পত্র নম্বর",
    aliases: ["smart NID", "smart card"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://bdnews24.com/bangladesh/election-commission-decides-on-10-digit-smart-nid-cards-for-bangladesh-nationals",
      ...SOURCES,
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
