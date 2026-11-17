/**
 * Qatar — Qatar ID number (QID, الرقم الشخصي), 11 digits: C YY NNN SSSSS.
 *
 * - C      century of birth: 2 = 1900s, 3 = 2000s.
 * - YY     year of birth.
 * - NNN    nationality as an ISO 3166-1 numeric code (634 = Qatari).
 * - SSSSS  serial; 00000 is not issued.
 * There's no published check digit (`checksum: false`).
 *
 * Ported from personal-identity-validation (structure, nationality list,
 * 00000 serial rule). idnumbers has no Qatari module.
 *
 * Improves on upstream:
 * - personal-identity-validation compares the two-digit year with the current
 *   one using `<`, so everyone born this year is rejected, and it reads the
 *   year from the UTC clock instead of the caller's date. We accept years up
 *   to and including the reference year.
 * - It doesn't extract anything; we return birth year, nationality and
 *   citizen/resident status.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** ISO 3166-1 numeric codes accepted as the nationality part (as in personal-identity-validation). */
const ISO_NUMERIC = new Set(
  (
    "004 248 008 012 016 020 024 660 010 028 032 051 533 036 040 031 044 048 050 052 112 056 084 204 060 064 068 535 " +
    "070 072 074 076 086 096 100 854 108 132 116 120 124 136 140 148 152 156 162 166 170 174 178 180 184 188 384 191 " +
    "192 531 196 203 208 262 212 214 218 818 222 226 232 233 748 231 238 234 242 246 250 254 258 260 266 270 268 276 " +
    "288 292 300 304 308 312 316 320 831 324 624 328 332 334 336 340 344 348 352 356 360 364 368 372 833 376 380 388 " +
    "392 832 400 398 404 296 408 410 414 417 418 428 422 426 430 434 438 440 442 446 450 454 458 462 466 470 584 474 " +
    "478 480 175 484 583 498 492 496 499 500 504 508 104 516 520 524 528 540 554 558 562 566 570 574 807 580 578 512 " +
    "586 585 275 591 598 600 604 608 612 616 620 630 634 638 642 643 646 652 654 659 662 663 666 670 882 674 678 682 " +
    "686 688 690 694 702 534 703 705 090 706 710 239 728 724 144 729 740 744 752 756 760 158 762 834 764 626 768 772 " +
    "776 780 788 792 795 796 798 800 804 784 826 840 581 858 860 548 862 704 092 850 876 732 887 894 716"
  ).split(" "),
);

export const QATAR = "634";

export const documents: DocumentSpec[] = [
  {
    code: "QA_QID",
    country: "QA",
    name: "Qatar ID Number",
    localName: "رقم البطاقة الشخصية",
    aliases: ["QID", "Qatar ID", "residence permit number", "RP number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [11],
    pattern: /^[23]\d{10}$/,
    example: "28463400123",
    sources: [
      "https://portal.moi.gov.qa/",
      "https://learn.microsoft.com/en-us/purview/sit-defn-qatari-id-card-number",
      "https://www.dohaguides.com/qatar-id-number/",
    ],
    upstream: ["personal-identity-validation"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 5], " "),
    parse(id, { referenceDate }) {
      const year = (id[0] === "2" ? 1900 : 2000) + Number(id.slice(1, 3));
      if (year > referenceDate.getFullYear()) return { ok: false, reason: "invalid_date" };
      const nationality = id.slice(3, 6);
      if (!ISO_NUMERIC.has(nationality)) return { ok: false, reason: "invalid_range" };
      const serial = id.slice(6);
      if (serial === "00000") return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: {
          birthYear: year,
          citizenship: nationality === QATAR ? "citizen" : "resident",
          serial,
          extra: { nationalityCode: nationality },
        },
      };
    },
  },
];
