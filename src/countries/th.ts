/**
 * Thailand — Population Identification Code (เลขประจำตัวประชาชน), 13 digits:
 * C PPDD BBBBB NN X, printed 1-2345-67890-12-3.
 *
 * - C      person category (Department of Provincial Administration):
 *            1 Thai, born from 1984, birth registered on time
 *            2 Thai, born from 1984, birth registered late
 *            3 Thai or foreigner in a house register before 31 May 1984
 *            4 Thai or foreigner moved into a house register before 1984, no number yet
 *            5 Thai added to a house register later (missed, corrected)
 *            6 foreigner residing temporarily, or entered illegally
 *            7 child of a category 6 person, born in Thailand
 *            8 foreigner who entered legally and was naturalised/registered from 1984
 *            0 persons without registration status or Thai nationality
 *              (stateless, unregistered children, some foreign students)
 *          9 is not issued.
 * - PPDD   registration office: PP province (same numeric codes as ISO 3166-2:TH),
 *          DD district (01 upwards; municipalities count down from 99, e.g. Pattaya 2096).
 * - BBBBB NN  register book/group and sequence.
 * - X      check digit: (11 − Σ dᵢ·(13 − i) mod 11) mod 10 over the first 12 digits.
 *
 * Improves on upstream (idnumbers):
 * - idnumbers rejects districts above a per-province maximum (with ad-hoc
 *   exceptions). Municipal offices are numbered down from 99 (Pattaya is 20-96),
 *   so valid municipal registrations were rejected. We validate the province only.
 * - Category 0 numbers (persons without status/nationality) don't carry a province
 *   office code; idnumbers applied the province check to them anyway.
 * - Category 9 is not issued; we reject it as invalid_format (same as idnumbers).
 * - Exposes the category and its meaning; idnumbers returned only the raw digit.
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** ISO 3166-2:TH numeric codes = DOPA province codes. */
export const TH_PROVINCES: Record<string, string> = {
  "10": "Bangkok", "11": "Samut Prakan", "12": "Nonthaburi", "13": "Pathum Thani", "14": "Phra Nakhon Si Ayutthaya",
  "15": "Ang Thong", "16": "Lop Buri", "17": "Sing Buri", "18": "Chai Nat", "19": "Saraburi", "20": "Chon Buri",
  "21": "Rayong", "22": "Chanthaburi", "23": "Trat", "24": "Chachoengsao", "25": "Prachin Buri", "26": "Nakhon Nayok",
  "27": "Sa Kaeo", "30": "Nakhon Ratchasima", "31": "Buri Ram", "32": "Surin", "33": "Si Sa Ket", "34": "Ubon Ratchathani",
  "35": "Yasothon", "36": "Chaiyaphum", "37": "Amnat Charoen", "38": "Bueng Kan", "39": "Nong Bua Lam Phu",
  "40": "Khon Kaen", "41": "Udon Thani", "42": "Loei", "43": "Nong Khai", "44": "Maha Sarakham", "45": "Roi Et",
  "46": "Kalasin", "47": "Sakon Nakhon", "48": "Nakhon Phanom", "49": "Mukdahan", "50": "Chiang Mai", "51": "Lamphun",
  "52": "Lampang", "53": "Uttaradit", "54": "Phrae", "55": "Nan", "56": "Phayao", "57": "Chiang Rai",
  "58": "Mae Hong Son", "60": "Nakhon Sawan", "61": "Uthai Thani", "62": "Kamphaeng Phet", "63": "Tak",
  "64": "Sukhothai", "65": "Phitsanulok", "66": "Phichit", "67": "Phetchabun", "70": "Ratchaburi", "71": "Kanchanaburi",
  "72": "Suphan Buri", "73": "Nakhon Pathom", "74": "Samut Sakhon", "75": "Samut Songkhram", "76": "Phetchaburi",
  "77": "Prachuap Khiri Khan", "80": "Nakhon Si Thammarat", "81": "Krabi", "82": "Phangnga", "83": "Phuket",
  "84": "Surat Thani", "85": "Ranong", "86": "Chumphon", "90": "Songkhla", "91": "Satun", "92": "Trang",
  "93": "Phatthalung", "94": "Pattani", "95": "Yala", "96": "Narathiwat",
};

const CATEGORY: Record<string, { description: string; citizenship?: string }> = {
  "0": { description: "no_registration_status", citizenship: "stateless" },
  "1": { description: "thai_born_from_1984", citizenship: "citizen" },
  "2": { description: "thai_born_from_1984_late_registration", citizenship: "citizen" },
  "3": { description: "registered_before_1984" },
  "4": { description: "moved_in_before_1984" },
  "5": { description: "thai_added_later", citizenship: "citizen" },
  "6": { description: "foreigner_temporary_or_illegal", citizenship: "foreigner" },
  "7": { description: "child_of_category_6", citizenship: "foreigner" },
  "8": { description: "foreigner_registered_from_1984" },
};

const WEIGHTS = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export function thaiCheckDigit(first12: string): number {
  return (11 - (weightedSum(first12, WEIGHTS) % 11)) % 10;
}

export const documents: DocumentSpec[] = [
  {
    code: "TH_PIN",
    country: "TH",
    name: "Thai Population Identification Code",
    localName: "เลขประจำตัวประชาชน",
    aliases: ["Thai national ID", "citizen ID", "บัตรประชาชน", "PIN"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [13],
    pattern: /^[0-8]\d{12}$/,
    example: "1101700000001",
    sources: [
      "https://www.bora.dopa.go.th/",
      "https://th.wikipedia.org/wiki/เลขประจำตัวประชาชนไทย",
      "https://en.wikipedia.org/wiki/ISO_3166-2:TH",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 4, 5, 2, 1], "-"),
    parse(id) {
      const cat = CATEGORY[id[0]!]!;
      const province = id.slice(1, 3);
      const hasOffice = id[0] !== "0";
      if (hasOffice && !TH_PROVINCES[province]) return { ok: false, reason: "invalid_range" };
      if (thaiCheckDigit(id.slice(0, 12)) !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: {
          ...(cat.citizenship ? { citizenship: cat.citizenship } : {}),
          ...(hasOffice ? { region: province, regionName: TH_PROVINCES[province] } : {}),
          serial: id.slice(5, 12),
          extra: {
            category: Number(id[0]),
            categoryDescription: cat.description,
            ...(hasOffice ? { registrationOffice: id.slice(1, 5) } : {}),
          },
        },
      };
    },
  },
];
