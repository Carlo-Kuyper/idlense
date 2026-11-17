import { describe, expect, test } from "vitest";
import { balticCheckDigit } from "../../src/countries/ee.js";
import { documents } from "../../src/countries/lt.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const withCheck = (b: string) => b + balticCheckDigit(b);
describeContract(documents);

describe("LT_ASMENS_KODAS", () => {
  test("extracts everything", () => {
    expect(v("LT_ASMENS_KODAS", "49005151237")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1990-05-15", birthYear: 1990, gender: "female", serial: "123" },
    });
    // OECD sheet's worked example (second-pass check digit)
    expect(v("LT_ASMENS_KODAS", "33309240064")).toMatchObject({ ok: true, data: { dateOfBirth: "1933-09-24", gender: "male" } });
  });

  test("rejections", () => {
    expect(v("LT_ASMENS_KODAS", "49005151238")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("LT_ASMENS_KODAS", withCheck("0900515123"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("LT_ASMENS_KODAS", withCheck("9900515123"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("LT_ASMENS_KODAS", withCheck("5300515123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("LT_ASMENS_KODAS", withCheck("3900230123"))).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LT_ASMENS_KODAS"),
      generate: (r) => fromTemplate("[0-9]##[01]#[0-3]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return undefined;
        if (/^[0789]/.test(s)) return "first digit outside 1-6 is not defined by law";
        const r = v("LT_ASMENS_KODAS", s);
        return !r.ok && r.reason === "invalid_date" ? "future birth date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("LT_JAK", () => {
  test("valid and invalid", () => {
    expect(v("LT_JAK", "110053842")).toMatchObject({ ok: true });
    expect(v("LT_JAK", "302151235")).toMatchObject({ ok: true });
    expect(v("LT_JAK", "110053843")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // 2·1 + 1·8 = 10 → never issued
    expect(v("LT_JAK", "200000010")).toMatchObject({ ok: false, reason: "invalid_range" });
  });
});

describe("LT_VAT", () => {
  test("valid and invalid", () => {
    expect(v("LT_VAT", "119511515")).toMatchObject({
      ok: true,
      normalized: "LT119511515",
      formatted: "LT 119511515",
      data: { extra: { kind: "legal_person" } },
    });
    expect(v("LT_VAT", "LT" + withCheck("10000191901"))).toMatchObject({
      ok: true,
      data: { extra: { kind: "temporary_or_natural_person" } },
    });
    expect(v("LT_VAT", "LT119511516")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("LT_VAT", "LT119511525")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except the position of the fixed 1", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LT_VAT"),
      generate: (r) => (r() < 0.5 ? fromTemplate("LT######[01][01]#", r) : fromTemplate("LT#########[01][01]#", r)),
      samples: 20000,
      allow: (s) => {
        const body = s.slice(2);
        const ourOne = body[body.length - 2] === "1";
        const theirOne = body[body.length - 3] === "1";
        return ourOne !== theirOne ? "nationid checks the fixed 1 one position too early" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
