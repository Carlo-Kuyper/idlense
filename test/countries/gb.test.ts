import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { documents, nhsCheckDigit, utrCheckDigit } from "../../src/countries/gb.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("GB_NINO", () => {
  test("valid", () => {
    expect(v("GB_NINO", "ab 12 34 56 c")).toMatchObject({
      ok: true,
      formatted: "AB 12 34 56 C",
      data: { region: "AB", serial: "123456", extra: { suffix: "C" } },
    });
  });
  test("rejections", () => {
    expect(v("GB_NINO", "AB123456F")).toMatchObject({ ok: false, reason: "invalid_format" }); // suffix A-D only
    expect(v("GB_NINO", "DA123456A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GB_NINO", "AO123456A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GB_NINO", "GB123456A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GB_NINO", "NC123456A")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("GB_NINO", "PP999999P")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GB_NINO", "PP999999D")).toMatchObject({ ok: true });
    expect(v("GB_NINO", "AB12345C")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => fromTemplate("AA######[A-DFMP]", r);
  // Fixes: suffix must be A-D (idnumbers allows F/M/P); FY/NC/PY/PZ are administrative.
  const allow = (s: string, ours: boolean) => {
    if (ours) return undefined;
    if (/[FMP]$/.test(s)) return "suffix F/M/P rejected";
    if (v("GB_NINO", s).ok === false && (v("GB_NINO", s) as { reason: string }).reason === "invalid_range")
      return "administrative prefix rejected";
    return undefined;
  };
  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "GB_NINO"), generate: gen, samples: 5000, allow });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "GB_NINO"), generate: gen, samples: 5000, allow });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GB_NHS", () => {
  test("valid", () => {
    expect(v("GB_NHS", "943 476 5919")).toMatchObject({ ok: true, formatted: "943 476 5919", data: { extra: { issuer: "england_wales_iom" } } });
    const chi = "010170123" + nhsCheckDigit("010170123");
    expect(v("GB_NHS", chi)).toMatchObject({ ok: true, data: { extra: { issuer: "scotland" } } });
    const hc = "320000000" + nhsCheckDigit("320000000");
    expect(v("GB_NHS", hc)).toMatchObject({ ok: true, data: { extra: { issuer: "northern_ireland" } } });
  });
  test("rejections", () => {
    expect(v("GB_NHS", "9434765918")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // remainder 1 → check 10: never issued
    let body = "100000000";
    for (let i = 0; nhsCheckDigit(body) !== undefined; i++) body = String(100000000 + i);
    expect(v("GB_NHS", body + "0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "GB_NHS"), generate: (r) => fromTemplate("##########", r), samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GB_UTR", () => {
  test("valid", () => {
    expect(v("GB_UTR", "92345 67891")).toMatchObject({ ok: true, formatted: "92345 67891" });
    expect(v("GB_UTR", "9234567891K")).toMatchObject({ ok: true });
    expect(v("GB_UTR", "8234567891")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(utrCheckDigit("234567890")).toBe(2); // remainder 0
    expect(utrCheckDigit("123456789")).toBe(1); // remainder 10
  });
  test("agrees with nationid except remainders 0/1", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GB_UTR"),
      generate: (r) => fromTemplate("##########", r),
      samples: 10000,
      allow: (s) => (weightedSum(s.slice(1), [6, 7, 8, 9, 10, 5, 4, 3, 2]) % 11 <= 1 ? "remainder 0 → 2, 1 → 1" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("GB_VAT", () => {
  test("valid", () => {
    expect(v("GB_VAT", "GB 980 7806 84")).toMatchObject({ ok: true, formatted: "GB 980 7806 84", data: { extra: { prefix: "GB", scheme: "standard" } } });
    expect(v("GB_VAT", "980780684001")).toMatchObject({ ok: true, normalized: "GB980780684001", data: { extra: { branch: "001" } } });
    expect(v("GB_VAT", "XI980780684")).toMatchObject({ ok: true, data: { extra: { prefix: "XI" } } });
    expect(v("GB_VAT", "GBGD001")).toMatchObject({ ok: true, data: { extra: { kind: "government" } } });
    expect(v("GB_VAT", "GBHA599")).toMatchObject({ ok: true, data: { extra: { kind: "health_authority" } } });
    expect(v("GB_VAT", "GBGD599")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("GB_VAT", "GB980780685")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "GB_VAT"),
      generate: (r) => fromTemplate("GB#######[0-9][0-9]", r),
      samples: 20000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
