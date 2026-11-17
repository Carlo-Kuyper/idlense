import { describe, expect, test } from "vitest";
import { luhnCheckDigit, verhoeffCheckDigit } from "../../src/core/algorithms.js";
import { documents, luEntityCheckDigit, luVatCheck } from "../../src/countries/lu.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const mat = (b: string) => b + luhnCheckDigit(b) + verhoeffCheckDigit(b);
describeContract(documents);

describe("LU_MATRICULE", () => {
  test("extracts", () => {
    expect(v("LU_MATRICULE", "1893 12 01 05732")).toMatchObject({
      ok: true,
      formatted: "1893 12 01 05732",
      data: { dateOfBirth: "1893-12-01", birthYear: 1893, serial: "057" },
    });
    expect(v("LU_MATRICULE", mat("20000229123"))).toMatchObject({ ok: true, data: { dateOfBirth: "2000-02-29" } });
  });
  test("rejections", () => {
    expect(v("LU_MATRICULE", "1893120105742")).toMatchObject({ ok: false, reason: "invalid_checksum" }); // Luhn
    expect(v("LU_MATRICULE", "1893120105733")).toMatchObject({ ok: false, reason: "invalid_checksum" }); // Verhoeff
    expect(v("LU_MATRICULE", mat("20010229123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("LU_MATRICULE", mat("20261231123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("LU_MATRICULE", mat("19801301123"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with idnumbers except future dates", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LU_MATRICULE"),
      generate: (r) => {
        const b = fromTemplate("[12][089]##[01]#[0-3]####", r);
        return r() < 0.8 ? mat(b) : b + fromTemplate("##", r);
      },
      samples: 10000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const x = v("LU_MATRICULE", s);
        if (!x.ok && x.reason === "invalid_date") return "future birth date rejected";
        if (!x.ok && x.reason === "invalid_format" && !/^(18|19|20)/.test(s)) return "birth year before 1800 rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("LU_VAT", () => {
  test("forms", () => {
    expect(v("LU_VAT", "LU 15027442")).toMatchObject({ ok: true, normalized: "LU15027442", formatted: "LU 15027442" });
    expect(v("LU_VAT", "15027442")).toMatchObject({ ok: true });
    expect(v("LU_VAT", "LU15027443")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "LU_VAT"),
      generate: (r) => {
        const b = fromTemplate("######", r);
        return "LU" + b + (r() < 0.6 ? luVatCheck(b) : fromTemplate("##", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("LU_MATRICULE_ENTITY", () => {
  const ent = (b: string) => b + luEntityCheckDigit(b);
  test("check digit per the OECD sheet", () => {
    // 1·5 + 9·4 + 9·3 + 9·2 + 2·7 + 4·6 + 0·5 + 1·4 + 2·3 + 3·2 = 140; 140 mod 11 = 8; 11 − 8 = 3.
    expect(luEntityCheckDigit("1999240123")).toBe(3);
    expect(v("LU_MATRICULE_ENTITY", "1999 2401 233")).toMatchObject({ ok: true, normalized: "19992401233", data: { extra: {} } });
    // Remainder 0 gives check digit 0.
    expect(luEntityCheckDigit("2000220018")).toBe(0);
    expect(v("LU_MATRICULE_ENTITY", "20002200180")).toMatchObject({ ok: true });
    expect(v("LU_MATRICULE_ENTITY", ent("2010000001"))).toMatchObject({ ok: true });
  });
  test("rejections", () => {
    expect(v("LU_MATRICULE_ENTITY", "19992401234")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // Remainder 1 is never allocated, whatever the 11th digit.
    expect(luEntityCheckDigit("2000220013")).toBeUndefined();
    for (const d of "0123456789") expect(v("LU_MATRICULE_ENTITY", "2000220013" + d)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("LU_MATRICULE_ENTITY", "1999240123")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("LU_MATRICULE_ENTITY", "1999240123A")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
