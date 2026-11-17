/**
 * Indonesia — NIK (Nomor Induk Kependudukan) and NPWP (taxpayer number).
 *
 * NIK: 16 digits, PP KK CC DDMMYY SSSS.
 * - PP   province code (Kemendagri / BPS area codes, table below).
 * - KK   regency (kabupaten 01-69) or city (kota 71-99) within the province.
 * - CC   district (kecamatan) where the NIK was first issued.
 * - DD   day of birth; +40 for women.
 * - MMYY month and two-digit year of birth (century not encoded: we take the
 *        latest century that puts the date in the past).
 * - SSSS serial 0001-9999.
 * No check digit.
 *
 * NPWP: the tax number. Legacy 15 digits (XX.XXX.XXX.X-XXX.XXX: taxpayer
 * type, serial, check digit, tax office, branch status). Since PMK
 * 112/PMK.03/2022 (in use from 2024) resident individuals use their NIK as
 * NPWP, and everyone else writes the legacy number with a leading 0
 * (16 digits). DJP doesn't publish the check-digit algorithm, so only the
 * shape is checked.
 *
 * NIK structure: PP 37/2007 art. 37 (6-digit area code, birth date with
 * +40 for women, 4-digit serial).
 *
 * Improves on upstream:
 * - idnumbers picks the century for the age by a "100 years ago" cut-off and
 *   accepts future birth dates; we use the latest past date.
 * - idnumbers rejects any kecamatan missing from its 2023 snapshot table, so
 *   NIKs from newly created districts (pemekaran) fail. We check the province
 *   (38 codes, incl. the 2022 Papua provinces 93-96) and that regency and
 *   district are not 00, and report the 2-digit province name.
 * - personal-identity-validation reads every NIK year as 19YY and rejects
 *   children born from 2000.
 */
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Province codes (Kepmendagri 100.1.1-6117/2022 and later updates). */
export const ID_PROVINCES: Record<string, string> = {
  "11": "Aceh",
  "12": "Sumatera Utara",
  "13": "Sumatera Barat",
  "14": "Riau",
  "15": "Jambi",
  "16": "Sumatera Selatan",
  "17": "Bengkulu",
  "18": "Lampung",
  "19": "Kepulauan Bangka Belitung",
  "21": "Kepulauan Riau",
  "31": "DKI Jakarta",
  "32": "Jawa Barat",
  "33": "Jawa Tengah",
  "34": "DI Yogyakarta",
  "35": "Jawa Timur",
  "36": "Banten",
  "51": "Bali",
  "52": "Nusa Tenggara Barat",
  "53": "Nusa Tenggara Timur",
  "61": "Kalimantan Barat",
  "62": "Kalimantan Tengah",
  "63": "Kalimantan Selatan",
  "64": "Kalimantan Timur",
  "65": "Kalimantan Utara",
  "71": "Sulawesi Utara",
  "72": "Sulawesi Tengah",
  "73": "Sulawesi Selatan",
  "74": "Sulawesi Tenggara",
  "75": "Gorontalo",
  "76": "Sulawesi Barat",
  "81": "Maluku",
  "82": "Maluku Utara",
  "91": "Papua",
  "92": "Papua Barat",
  "93": "Papua Selatan",
  "94": "Papua Tengah",
  "95": "Papua Pegunungan",
  "96": "Papua Barat Daya",
};

export const documents: DocumentSpec[] = [
  {
    code: "ID_NIK",
    country: "ID",
    name: "Indonesian Population Identification Number",
    localName: "Nomor Induk Kependudukan",
    aliases: ["NIK", "KTP number", "e-KTP"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [16],
    // PP KK CC, DD 01-31 / 41-71, MM 01-12, YY, serial ≠ 0000
    pattern: /^\d{2}(?!00)\d{2}(?!00)\d{2}(0[1-9]|[12]\d|3[01]|4[1-9]|[56]\d|7[01])(0[1-9]|1[0-2])\d{2}(?!0000)\d{4}$/,
    example: "3174054101900001",
    sources: [
      "https://peraturan.bpk.go.id/Details/4782/pp-no-37-tahun-2007",
      "https://www.nu.or.id/nasional/tahukah-anda-arti-16-digit-nomor-ktp-yoXKi",
      "https://dukcapil.kemendagri.go.id/",
      "https://en.wikipedia.org/wiki/Indonesian_identity_card",
    ],
    upstream: ["idnumbers", "personal-identity-validation"],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 6, 4], " "),
    parse(id, { referenceDate }) {
      const province = id.slice(0, 2);
      const regionName = ID_PROVINCES[province];
      if (!regionName) return { ok: false, reason: "invalid_range" };
      let day = Number(id.slice(6, 8));
      const female = day > 40;
      if (female) day -= 40;
      const month = Number(id.slice(8, 10));
      const year = latestPastYear(Number(id.slice(10, 12)), month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: {
          ...birth,
          gender: female ? "female" : "male",
          region: province,
          regionName,
          serial: id.slice(12),
          extra: { regency: id.slice(0, 4), district: id.slice(0, 6) },
        },
      };
    },
  },
  {
    code: "ID_NPWP",
    country: "ID",
    name: "Indonesian Taxpayer Identification Number",
    localName: "Nomor Pokok Wajib Pajak",
    aliases: ["NPWP", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [15, 16],
    pattern: /^0?\d{15}$/,
    example: "311234567012000",
    sources: [
      "https://www.pajak.go.id/sites/default/files/2022-07/SP-43%202022%20NPWP%20Format%20Baru%20PMK%20112%202022.pdf",
      "https://www.pwc.com/id/en/taxflash/assets/english/2022/taxflash-2022-15.pdf",
    ],
    upstream: ["personal-identity-validation"],
    normalize: digitsOnly,
    format: (c) => (c.length === 15 ? group(c, [2, 3, 3, 1, 3, 3], [".", ".", ".", "-", "."]) : c),
    parse(id) {
      const n = id.length === 16 ? id.slice(1) : id;
      return {
        ok: true,
        data: {
          serial: n.slice(2, 8),
          extra: { taxpayerType: n.slice(0, 2), taxOffice: n.slice(9, 12), branch: n.slice(12, 15), sixteenDigit: id.length === 16 },
        },
      };
    },
  },
];
