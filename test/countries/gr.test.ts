import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { afmCheckDigit, documents } from "../../src/countries/gr.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const AFM = spec(documents, "GR_VAT");
const AMKA = spec(documents, "GR_AMKA");
const ADT = spec(documents, "GR_ADT");
describeContract(documents);

describe("GR_VAT (ΑΦΜ)", () => {
  test("forms and rejections", () => {
    expect(check(AFM, "123456783")).toMatchObject({ ok: true, normalized: "123456783" });
    expect(check(AFM, "EL 123456783")).toMatchObject({ ok: true, normalized: "123456783" });
    expect(check(AFM, "GR123456783")).toMatchObject({ ok: true });
    expect(check(AFM, "094014250")).toMatchObject({ ok: true });
    expect(check(AFM, "123456784")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(AFM, "000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(AFM, "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const b = fromTemplate("########", r);
    return r() < 0.5 ? b + afmCheckDigit(b) : b + fromTemplate("#", r);
  };
  const allow = (s: string, ours: boolean) => (!ours && s === "000000000" ? "all-zero AFM rejected" : undefined);

  test("agrees with nationid GR_VAT", () => {
    const res = compareWithOracle({ spec: AFM, generate: gen, allow, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers GRC", () => {
    const res = compareWithOracle({
      spec: AFM,
      generate: gen,
      allow,
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GR_AMKA", () => {
  const amka = (b: string) => b + luhnCheckDigit(b);
  test("extracts everything", () => {
    expect(check(AMKA, "01018012342")).toMatchObject({
      ok: true,
      formatted: "010180 12342",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "female", serial: "1234" },
    });
    expect(check(AMKA, amka("0101801233"))).toMatchObject({ ok: true, data: { gender: "male" } });
    expect(check(AMKA, amka("1711260001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1926-11-17" } });
    expect(check(AMKA, amka("1611260001"))).toMatchObject({ ok: true, data: { dateOfBirth: "2026-11-16" } });
    expect(check(AMKA, amka("2902000001"))).toMatchObject({ ok: true, data: { dateOfBirth: "2000-02-29" } });
  });

  test("rejections", () => {
    expect(check(AMKA, "01018012343")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(AMKA, amka("2902010001"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(AMKA, amka("3104800001"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(AMKA, "01138012342")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("GR_ADT", () => {
  test("normalises Latin lookalikes and lowercase", () => {
    expect(check(ADT, "AB-123456")).toMatchObject({ ok: true, normalized: "ΑΒ123456", formatted: "ΑΒ 123456", data: { extra: { kind: "current" } } });
    expect(check(ADT, "αβ 123456")).toMatchObject({ ok: true, normalized: "ΑΒ123456" });
    expect(check(ADT, "Χ-123456")).toMatchObject({ ok: true, data: { serial: "123456", extra: { kind: "old" } } });
    expect(check(ADT, "ΣΩ654321")).toMatchObject({ ok: true });
    expect(check(ADT, "AC123456")).toMatchObject({ ok: false, reason: "invalid_format" }); // C has no Greek twin
    expect(check(ADT, "ΑΒ12345")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ADT, "ΑΒ1234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const GREEK = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
  const pick = (r: () => number, s: string) => s[Math.floor(r() * s.length)]!;

  test("agrees with idnumbers IdentityCard (two letters)", () => {
    const res = compareWithOracle({
      spec: ADT,
      generate: (r) => pick(r, GREEK + "ABEZHIKMNOPTYXC") + pick(r, GREEK + "ABEZHIKMNOPTYX") + (r() < 0.5 ? "-" : "") + fromTemplate("######", r),
      samples: 3000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers OldIdentityCard (one letter)", () => {
    const res = compareWithOracle({
      spec: ADT,
      generate: (r) => pick(r, GREEK + "ABEZ") + (r() < 0.5 ? "-" : "") + fromTemplate("######", r),
      allow: (s, ours) => (ours && /^[ABEZ]/.test(s) ? "Latin lookalike letter accepted on old cards" : undefined),
      samples: 3000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
