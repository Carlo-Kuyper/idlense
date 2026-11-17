/**
 * India — Aadhaar, Virtual ID, PAN, GSTIN and EPIC (voter ID).
 *
 * - Aadhaar (UIDAI): 12 digits, first digit 2-9 (0 and 1 are reserved;
 *   1 is the VID range). Verhoeff check digit over all 12 digits. UIDAI's
 *   numbering-scheme paper also excludes palindromes. Encodes nothing about
 *   the holder (deliberately random).
 * - VID (UIDAI Virtual ID): 16 digits, revocable alias for an Aadhaar number,
 *   Verhoeff check digit. The leading `1` follows nationid; UIDAI doesn't
 *   publish the range, so confidence is moderate.
 * - PAN (Income Tax Department, Income-tax Act s.139A, Rule 114):
 *   `AAA P L 9999 A`. Characters 1-3 are an alphabetic series, the 4th is the
 *   holder's status (P individual, C company, H HUF, F firm/LLP, A AOP,
 *   T trust, B BOI, L local authority, J artificial juridical person,
 *   G government), the 5th the first letter of the surname/name, then a
 *   sequence 0001-9999 and a final alphabetic check character whose
 *   algorithm is not published, so `checksum: false`.
 * - GSTIN (CGST Rules 2017, rule 10): 2-digit state code + the holder's PAN
 *   + entity number (1-9, A-Z) + `Z` + a mod-36 Luhn check character.
 * - EPIC (Election Commission): 3 letters + 7 digits. No published check
 *   digit; shape only.
 *
 * Ported from nationid (IN_AADHAAR, IN_VID, IN_PAN, IN_GSTIN, IN_EPIC) and
 * idnumbers (IND Aadhaar).
 *
 * Improves on upstream:
 * - idnumbers accepts Verhoeff-valid palindromic Aadhaar numbers, which
 *   UIDAI excludes (nationid already rejects them).
 * - PAN serial `0000` is reported as `invalid_range` (unissued) rather than a
 *   generic format error; the holder status is extracted.
 * - GSTIN: unknown state codes are `invalid_range`; the state name, embedded
 *   PAN and holder status are extracted.
 */
import { alnumValue, verhoeffValid } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** PAN 4th character: status of the holder. */
export const IN_PAN_STATUS: Record<string, string> = {
  P: "individual",
  C: "company",
  H: "hindu_undivided_family",
  F: "firm",
  A: "association_of_persons",
  T: "trust",
  B: "body_of_individuals",
  L: "local_authority",
  J: "artificial_juridical_person",
  G: "government",
};

/** GST state/UT codes (GSTN state code list). */
export const IN_GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (before 2014)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "96": "Other country",
  "97": "Other territory",
  "99": "Centre jurisdiction",
};

const PAN_BODY = "[A-Z]{3}[ABCFGHJLPT][A-Z]\\d{4}[A-Z]";

function isPalindrome(s: string): boolean {
  for (let i = 0; i < s.length >> 1; i++) if (s[i] !== s[s.length - 1 - i]) return false;
  return true;
}

/** Luhn over base 36 (0-9, A-Z), check character last. Used by GSTIN. */
export function luhnMod36Valid(s: string): boolean {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const v = alnumValue(s[s.length - 1 - i]!);
    if (v < 0) return false;
    if (i % 2 === 0) sum += v;
    else {
      const d = v * 2;
      sum += Math.floor(d / 36) + (d % 36);
    }
  }
  return sum % 36 === 0;
}

function panData(pan: string) {
  return { holderStatus: IN_PAN_STATUS[pan[3]!]! };
}

const UIDAI_SOURCES = [
  "https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html",
  "https://web.archive.org/web/20140611025606/http://uidai.gov.in/UID_PDF/Working_Papers/A_UID_Numbering_Scheme.pdf",
];

export const documents: DocumentSpec[] = [
  {
    code: "IN_AADHAAR",
    country: "IN",
    name: "Aadhaar Number",
    localName: "आधार",
    aliases: ["UID", "Aadhar", "UIDAI number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [12],
    pattern: /^[2-9]\d{11}$/,
    example: "234123412346",
    sources: UIDAI_SOURCES,
    upstream: ["nationid", "idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4], " "),
    parse(id) {
      if (isPalindrome(id)) return { ok: false, reason: "invalid_range" };
      if (!verhoeffValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "IN_VID",
    country: "IN",
    name: "Aadhaar Virtual ID",
    aliases: ["VID", "Virtual ID"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [16],
    pattern: /^1\d{15}$/,
    example: "1234567890123455",
    sources: ["https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/aadhaar-online-services/virtual-id-vid.html"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 4, 4, 4], " "),
    parse: (id) => (verhoeffValid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "IN_PAN",
    country: "IN",
    name: "Permanent Account Number",
    aliases: ["PAN", "PAN card"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "high",
    lengths: [10],
    pattern: new RegExp(`^${PAN_BODY}$`),
    example: "ABCPE1234F",
    sources: [
      "https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-",
      "https://incometaxindia.gov.in/tutorials/1.permanent%20account%20number%20(pan).pdf",
    ],
    upstream: ["nationid"],
    parse(id) {
      if (id.slice(5, 9) === "0000") return { ok: false, reason: "invalid_range" };
      return { ok: true, data: { serial: id.slice(5, 9), extra: panData(id) } };
    },
  },
  {
    code: "IN_GSTIN",
    country: "IN",
    name: "Goods and Services Tax Identification Number",
    aliases: ["GSTIN", "GST number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [15],
    pattern: new RegExp(`^\\d{2}${PAN_BODY}[1-9A-Z]Z[0-9A-Z]$`),
    example: "27AAPFU0939F1ZV",
    sources: [
      "https://cbic-gst.gov.in/",
      "https://tutorial.gst.gov.in/userguide/registration/index.htm",
      "https://en.wikipedia.org/wiki/Goods_and_Services_Tax_(India)",
    ],
    upstream: ["nationid"],
    parse(id) {
      const state = id.slice(0, 2);
      const regionName = IN_GST_STATES[state];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      const pan = id.slice(2, 12);
      if (pan.slice(5, 9) === "0000") return { ok: false, reason: "invalid_range" };
      if (!luhnMod36Valid(id)) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: { region: state, regionName, extra: { pan, entityNumber: id[12]!, ...panData(pan) } },
      };
    },
  },
  {
    code: "IN_EPIC",
    country: "IN",
    name: "Elector's Photo Identity Card Number",
    aliases: ["EPIC", "voter ID"],
    purpose: "voter",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [10],
    pattern: /^[A-Z]{3}\d{7}$/,
    example: "ABC1234567",
    sources: ["https://voters.eci.gov.in/", "https://www.eci.gov.in/"],
    upstream: ["nationid"],
    parse: (id) => ({ ok: true, data: { serial: id.slice(3), extra: { series: id.slice(0, 3) } } }),
  },
];
