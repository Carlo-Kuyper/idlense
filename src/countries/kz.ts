/**
 * Kazakhstan — IIN (individual identification number) and BIN (business
 * identification number). Law No. 223-III "On national registers of
 * identification numbers" (2007); structure as published in Kazakhstan's
 * OECD TIN sheet.
 *
 * IIN, 12 digits: YYMMDD G NNNN C.
 * - G 1/2 → 1800s, 3/4 → 1900s, 5/6 → 2000s (odd male, even female);
 *     0 → foreign citizen (century and sex not encoded).
 * - C Σ d·(1..11) mod 11; on 10 retry with weights 3..11,1,2; a second 10
 *     means the number is never issued.
 * The authorities stress the IIN is an opaque identifier: if the birth date
 * or sex was mistyped at registration, the IIN keeps the wrong values. The
 * date we extract is the one encoded, not necessarily the real one.
 *
 * BIN, 12 digits: YYMM T D NNNNN C.
 * - YYMM year and month of (re-)registration.
 * - T 4 resident legal entity, 5 non-resident legal entity, 6 joint
 *     individual entrepreneurship (ИП(С)).
 * - D 0 head office, 1 branch, 2 representative office, 3 peasant/farm
 *     enterprise run as a joint undertaking.
 * - NNNNN registration serial. Per Kazakhstan's OECD TIN sheet (quoting the
 *     rules as amended by Government Resolution No. 649), serials
 *     90001-99999 are reserved for AIFC (Astana International Financial
 *     Centre) bodies, their organisations and AIFC participants, assigned by
 *     the AIFC registration authorities; we flag those with `extra.aifc: true`.
 * - C same check digit as the IIN.
 *
 * Improves on upstream (idnumbers):
 * - IIN: G = 0 (foreign citizens) was rejected; birth dates in the future
 *   were accepted.
 * - BIN: entity types 5 and 6 were all reported as resident legal entities;
 *   the registration month wasn't checked (we require 01-12).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const W1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const W2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

/** Check digit for IIN/BIN, or undefined when both passes give 10 (never issued). */
export function kzCheckDigit(id: string): number | undefined {
  const r1 = weightedSum(id, W1) % 11;
  if (r1 < 10) return r1;
  const r2 = weightedSum(id, W2) % 11;
  return r2 < 10 ? r2 : undefined;
}

const ENTITY_TYPE: Record<string, string> = {
  "4": "resident_legal_entity",
  "5": "non_resident_legal_entity",
  "6": "joint_individual_entrepreneur",
};
const DIVISION: Record<string, string> = {
  "0": "head_office",
  "1": "branch",
  "2": "representative_office",
  "3": "peasant_farm",
};

const SOURCES = [
  "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/kazakhstan-tin.pdf",
  "https://adilet.zan.kz/rus/docs/Z070000223_",
];

export const documents: DocumentSpec[] = [
  {
    code: "KZ_IIN",
    country: "KZ",
    name: "Kazakh Individual Identification Number",
    localName: "ЖСН / ИИН (индивидуальный идентификационный номер)",
    aliases: ["IIN", "ИИН", "ЖСН", "ZhSN"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [12],
    // MM 01-12, DD 01-31, G 0-6
    pattern: /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[0-6]\d{5}$/,
    example: "800101300016",
    sources: [...SOURCES, "https://ru.wikipedia.org/wiki/Индивидуальный_идентификационный_номер"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const check = kzCheckDigit(id);
      const yy = Number(id.slice(0, 2));
      const month = Number(id.slice(2, 4));
      const day = Number(id.slice(4, 6));
      const g = Number(id[6]);
      const year = g === 0 ? latestPastYear(yy, month, day, referenceDate) : 1800 + Math.floor((g - 1) / 2) * 100 + yy;
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (check === undefined) return { ok: false, reason: "invalid_range" };
      if (check !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data:
          g === 0
            ? { ...birth, citizenship: "foreigner", serial: id.slice(7, 11), extra: {} }
            : { ...birth, gender: g % 2 === 1 ? "male" : "female", serial: id.slice(7, 11), extra: {} },
      };
    },
  },
  {
    code: "KZ_BIN",
    country: "KZ",
    name: "Kazakh Business Identification Number",
    localName: "БСН / БИН (бизнес-идентификационный номер)",
    aliases: ["BIN", "БИН", "БСН"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [12],
    // MM 01-12, type 4-6, division 0-3
    pattern: /^\d{2}(0[1-9]|1[0-2])[4-6][0-3]\d{6}$/,
    example: "100140000003",
    sources: [...SOURCES, "https://ru.wikipedia.org/wiki/Бизнес-идентификационный_номер"],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id) {
      const check = kzCheckDigit(id);
      if (check === undefined) return { ok: false, reason: "invalid_range" };
      if (check !== Number(id[11])) return { ok: false, reason: "invalid_checksum" };
      const serial = id.slice(6, 11);
      return {
        ok: true,
        data: {
          serial,
          extra: {
            entityType: ENTITY_TYPE[id[4]!]!,
            division: DIVISION[id[5]!]!,
            registered: `${id.slice(0, 2)}-${id.slice(2, 4)}`,
            ...(Number(serial) >= 90001 ? { aifc: true } : {}),
          },
        },
      };
    },
  },
];
