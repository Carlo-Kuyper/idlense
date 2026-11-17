/**
 * Brunei — Smart identity card (IC) number and Registry of Companies number.
 *
 * Brunei issues no TIN. Per the Revenue Division's TIN sheet for the OECD
 * (Ministry of Finance, Aug 2018), individuals are identified by their IC
 * number and entities by their company/business registration number.
 *
 * BN_IC, 8 digits written NN-NNNNNN. The two-digit prefix gives the holder's
 * status (the card colour). The issuer's table:
 * - issued from 2000: 01-29 citizen (yellow), 31-49 permanent resident
 *   (purple), 51-99 temporary resident (green).
 * - issued before 2000: prefixes 00, 30 and 50 with fixed serial blocks:
 *   00: 000001-080000, 110001-130000, 250001-650000 (citizen);
 *   30: 080001-110000, 200001-250000 (permanent resident);
 *   50: 130001-200000, 650001-999999 (temporary resident).
 *   A serial outside its prefix's blocks is `invalid_range`.
 * The prefix is not a birth year (some commercial sites claim it is). No check
 * digit is published. Confidence `high` (issuer document).
 *
 * BN_ROC, the Registry of Companies and Business Names number: P + 8 digits
 * (sole proprietorship/partnership, Business Names Act), RC + 8 (company,
 * Companies Act) or RFC + 8 (foreign company branch). The OECD sheet writes
 * the 8 positions as placeholders; MOFE's Business Reporting briefing pack
 * (old "RC/567/2012" becomes "RC00000567") and its striking-off notices show
 * they are digits. No check digit.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const OECD_SHEET = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/brunei-darussalam-tin%20.pdf";

type Status = "citizen" | "permanent_resident" | "temporary_resident";
const COLOUR: Record<Status, string> = { citizen: "yellow", permanent_resident: "purple", temporary_resident: "green" };

/** Pre-2000 serial blocks per prefix (inclusive). */
const PRE_2000: Record<string, { status: Status; blocks: [number, number][] }> = {
  "00": { status: "citizen", blocks: [[1, 80000], [110001, 130000], [250001, 650000]] },
  "30": { status: "permanent_resident", blocks: [[80001, 110000], [200001, 250000]] },
  "50": { status: "temporary_resident", blocks: [[130001, 200000], [650001, 999999]] },
};

function icStatus(id: string): { status: Status; before2000: boolean } | undefined {
  const prefix = id.slice(0, 2);
  const old = PRE_2000[prefix];
  if (old) {
    const serial = Number(id.slice(2));
    return old.blocks.some(([lo, hi]) => serial >= lo && serial <= hi) ? { status: old.status, before2000: true } : undefined;
  }
  const p = Number(prefix);
  if (p >= 1 && p <= 29) return { status: "citizen", before2000: false };
  if (p >= 31 && p <= 49) return { status: "permanent_resident", before2000: false };
  if (p >= 51 && p <= 99) return { status: "temporary_resident", before2000: false };
  return undefined;
}

const ROC_KIND: Record<string, string> = { P: "business_name", RC: "company", RFC: "foreign_company_branch" };

export const documents: DocumentSpec[] = [
  {
    code: "BN_IC",
    country: "BN",
    name: "Brunei Identity Card Number",
    localName: "Kad Pengenalan Pintar",
    aliases: ["IC", "Smart IC", "NRIC", "IC number", "kad pengenalan"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "01123456",
    sources: [OECD_SHEET],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 6], "-"),
    parse(id) {
      const s = icStatus(id);
      if (!s) return { ok: false, reason: "invalid_range" };
      return {
        ok: true,
        data: {
          citizenship: s.status,
          serial: id.slice(2),
          extra: { cardColour: COLOUR[s.status], issuedBefore2000: s.before2000 },
        },
      };
    },
  },
  {
    code: "BN_ROC",
    country: "BN",
    name: "Brunei Company / Business Name Registration Number",
    aliases: ["ROC number", "ROCBN", "company registration number", "business registration number"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "high",
    lengths: [9, 10, 11],
    pattern: /^(P|RC|RFC)\d{8}$/,
    example: "RC00000567",
    sources: [
      OECD_SHEET,
      "https://business.mofe.gov.bn/Shared%20Documents/BR%20Guideline%20and%20related%20docs/Business%20Reporting%20(BR)%20Briefing%20Pack%20(051218).pdf",
      "https://www.mofe.gov.bn/wp-content/uploads/2025/12/Published-on-14th-August-2025-1.pdf",
    ],
    parse(id) {
      const prefix = id.slice(0, -8);
      return { ok: true, data: { serial: id.slice(-8), extra: { kind: ROC_KIND[prefix]! } } };
    },
  },
];
