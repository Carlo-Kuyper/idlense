/**
 * Vietnam — personal identification number (số định danh cá nhân), printed on the
 * Citizen Identity Card (CCCD, since 2016) and the Identity Card (thẻ căn cước,
 * since July 2024), and the old 9-digit People's Identity Card (CMND).
 *
 * 12 digits, PPP G YY RRRRRR (Circular 07/2016/TT-BCA, replaced by Circular
 * 59/2021/TT-BCA, Art. 4 and Annexes I-III; carried over by Circular 17/2024/TT-BCA):
 * - PPP    code of the province where the birth was registered (Annex I,
 *          001-096; the 63 pre-2025 provinces), or a country code for births
 *          registered abroad (Annex II). Unknown codes are therefore not rejected;
 *          `regionName` is filled from Annex I only.
 * - G      century and sex: 0/1 = 1900s, 2/3 = 2000s, 4/5 = 2100s, 6/7 = 2200s,
 *          8/9 = 2300s; even male, odd female.
 * - YY     last two digits of the birth year.
 * - RRRRRR random. No check digit.
 *
 * CMND: 9 digits, no check digit and no published structure we can verify
 * (the first two digits are the issuing province in practice). CMND cards stopped
 * being valid on 2025-01-01 (Law on Identification 2023, Art. 46), so it is deprecated.
 *
 * Improves on upstream (idnumbers):
 * - Rejects birth years in the future: idnumbers maps G 4-9 to 2100-2399.
 * - Rejects province code 000.
 * - Splits the 9-digit CMND into its own (deprecated, shape-only) document;
 *   idnumbers accepts it as a CCCD and returns NaN for the year.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Circular 07/2016/TT-BCA / 59/2021/TT-BCA, Annex I. */
export const VN_PROVINCES: Record<string, string> = {
  "001": "Hà Nội", "002": "Hà Giang", "004": "Cao Bằng", "006": "Bắc Kạn", "008": "Tuyên Quang",
  "010": "Lào Cai", "011": "Điện Biên", "012": "Lai Châu", "014": "Sơn La", "015": "Yên Bái",
  "017": "Hòa Bình", "019": "Thái Nguyên", "020": "Lạng Sơn", "022": "Quảng Ninh", "024": "Bắc Giang",
  "025": "Phú Thọ", "026": "Vĩnh Phúc", "027": "Bắc Ninh", "030": "Hải Dương", "031": "Hải Phòng",
  "033": "Hưng Yên", "034": "Thái Bình", "035": "Hà Nam", "036": "Nam Định", "037": "Ninh Bình",
  "038": "Thanh Hóa", "040": "Nghệ An", "042": "Hà Tĩnh", "044": "Quảng Bình", "045": "Quảng Trị",
  "046": "Thừa Thiên Huế", "048": "Đà Nẵng", "049": "Quảng Nam", "051": "Quảng Ngãi", "052": "Bình Định",
  "054": "Phú Yên", "056": "Khánh Hòa", "058": "Ninh Thuận", "060": "Bình Thuận", "062": "Kon Tum",
  "064": "Gia Lai", "066": "Đắk Lắk", "067": "Đắk Nông", "068": "Lâm Đồng", "070": "Bình Phước",
  "072": "Tây Ninh", "074": "Bình Dương", "075": "Đồng Nai", "077": "Bà Rịa - Vũng Tàu", "079": "Hồ Chí Minh",
  "080": "Long An", "082": "Tiền Giang", "083": "Bến Tre", "084": "Trà Vinh", "086": "Vĩnh Long",
  "087": "Đồng Tháp", "089": "An Giang", "091": "Kiên Giang", "092": "Cần Thơ", "093": "Hậu Giang",
  "094": "Sóc Trăng", "095": "Bạc Liêu", "096": "Cà Mau",
};

export const documents: DocumentSpec[] = [
  {
    code: "VN_CCCD",
    country: "VN",
    name: "Vietnamese Personal Identification Number",
    localName: "Số định danh cá nhân",
    aliases: ["CCCD", "Căn cước công dân", "Căn cước", "citizen identity card number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [12],
    pattern: /^(?!000)\d{3}\d{9}$/,
    example: "001089000123",
    sources: [
      "https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Circular-59-2021-TT-BCA-elaborating-to-Law-on-Citizen-Identity-Card-479508.aspx",
      "https://lawnet.vn/en/vb/Circular-07-2016-TT-BCA-detailing-Law-on-Citizen-Identification-137-2015-ND-CP-5CCC3.html",
      "https://baohiemxahoidientu.vn/bhxh/ma-so-can-cuoc-cong-dan.html",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const g = Number(id[3]);
      const year = 1900 + 100 * Math.floor(g / 2) + Number(id.slice(4, 6));
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      const region = id.slice(0, 3);
      const regionName = VN_PROVINCES[region];
      return {
        ok: true,
        data: {
          birthYear: year,
          gender: g % 2 === 0 ? "male" : "female",
          citizenship: "citizen",
          region,
          ...(regionName ? { regionName } : {}),
          serial: id.slice(6),
          extra: {},
        },
      };
    },
  },
  {
    code: "VN_CMND",
    country: "VN",
    name: "Vietnamese People's Identity Card Number",
    localName: "Chứng minh nhân dân",
    aliases: ["CMND", "CMT"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    deprecated: true,
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "012345678",
    sources: [
      "https://en.wikipedia.org/wiki/Vietnamese_identity_card",
      "https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Can-cuoc-2023-so-26-2023-QH15-544793.aspx",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { citizenship: "citizen", extra: {} } }),
  },
];
