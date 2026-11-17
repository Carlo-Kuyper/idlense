import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/sa.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const NIN = spec(documents, "SA_NIN");
const IQAMA = spec(documents, "SA_IQAMA");
describeContract(documents);

describe("Saudi Arabia", () => {
  test("national ID (citizen)", () => {
    expect(check(NIN, "1000000008")).toMatchObject({ ok: true, data: { citizenship: "citizen", serial: "00000000", extra: {} } });
    expect(check(NIN, "1123456780").ok).toBe(true);
  });

  test("iqama (resident)", () => {
    expect(check(IQAMA, "2123456788")).toMatchObject({ ok: true, data: { citizenship: "resident", serial: "12345678" } });
  });

  test("rejections", () => {
    expect(check(NIN, "1000000009")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(NIN, "2123456788")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IQAMA, "1000000008")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IQAMA, "3000000006")).toMatchObject({ ok: false, reason: "invalid_format" });
    // idnumbers hard-codes this one as valid; it fails Luhn
    expect(check(IQAMA, "2000000007")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  for (const [code, lead] of [["SA_NIN", "1"], ["SA_IQAMA", "2"]] as const) {
    test(`${code} agrees with idnumbers except its hard-coded 2000000007`, () => {
      const res = compareWithOracle({
        spec: spec(documents, code),
        generate: (r) => {
          if (r() < 0.01) return "2000000007";
          const body = lead + fromTemplate("########", r);
          return r() < 0.5 ? body + luhnCheckDigit(body) : fromTemplate("[1-3]#########", r);
        },
        // idnumbers treats both kinds as one document: a number of the other kind is "theirs only"
        allow: (s, ours) =>
          !ours && s === "2000000007"
            ? "hard-coded fixture rejected"
            : !ours && s[0] !== lead && (s[0] === "1" || s[0] === "2")
              ? "other holder type (split into SA_NIN / SA_IQAMA)"
              : undefined,
      });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    });
  }
});
