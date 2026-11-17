/**
 * Kyrgyzstan — personal identification number (PIN, ПИН / ЖИН).
 *
 * 14 digits, ПЧЧММГГГГРНННК (also the individual's ИНН):
 * - П        sex for citizens: 1 female, 2 male. News reports (Cabinet
 *            decision No. 598) say foreigners and stateless persons use 3/4,
 *            moving to 4 only; we accept 3/4 as `foreigner` without a sex.
 * - ЧЧММГГГГ date of birth, DDMMYYYY (full year, so no century guessing).
 * - Р        who first issued it: 1 tax authority, 5 the authorised state
 *            body, other digits the social insurance fund.
 * - ННН      serial.
 * - К        a check digit "formed by a special algorithm" that isn't
 *            published, so we don't verify it.
 * Source: the draft order's text on Toktom (the order in force, Cabinet
 * Resolution No. 207 of 17.04.2025, has a paywalled annex). Confidence
 * `moderate` for the layout, lower for the foreigner digit. KZ's IIN and UZ's
 * PINFL look similar but follow different rules.
 *
 * Not covered: the 14-digit ИНН of legal entities. Its layout (a leading
 * 0/4, registration date, serial, check digit) is only inferred from
 * aggregator data.
 */
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const ISSUER: Record<string, string> = { "1": "tax_authority", "5": "state_registry" };

export const documents: DocumentSpec[] = [
  {
    code: "KG_PIN",
    country: "KG",
    name: "Kyrgyz Personal Identification Number",
    localName: "Персональный идентификационный номер",
    aliases: ["PIN", "ПИН", "ЖИН", "ИНН", "INN", "personal number"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "moderate",
    lengths: [14],
    pattern: /^[1-4](0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(1[89]|20)\d{7}$/,
    example: "21501199010015",
    sources: [
      "https://online.toktom.kg/NewsTopic/5492",
      "https://continent-online.com/Document/?doc_id=37113206",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [1, 8, 1, 3, 1], " "),
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(5, 9)), Number(id.slice(3, 5)), Number(id.slice(1, 3)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      const s = id[0]!;
      const citizen = s === "1" || s === "2";
      return {
        ok: true,
        data: {
          ...birth,
          ...(citizen ? { gender: s === "2" ? ("male" as const) : ("female" as const), citizenship: "citizen" } : { citizenship: "foreigner" }),
          serial: id.slice(10, 13),
          extra: { issuer: ISSUER[id[9]!] ?? "social_fund", checkDigit: id[13]! },
        },
      };
    },
  },
];
