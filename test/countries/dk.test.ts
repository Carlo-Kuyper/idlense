import { describe, expect, test } from "vitest";
import { cprCentury, documents } from "../../src/countries/dk.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

describe("DK_CPR", () => {
  test("extracts everything", () => {
    expect(v("DK_CPR", "010160-1235")).toMatchObject({
      ok: true,
      formatted: "010160-1235",
      data: { dateOfBirth: "1960-01-01", birthYear: 1960, gender: "male", serial: "1235", extra: { modulus11: false } },
    });
    // 070761-4285: classic example that passes modulus 11.
    expect(v("DK_CPR", "0707614285")).toMatchObject({ ok: true, data: { dateOfBirth: "1961-07-07", gender: "male", extra: { modulus11: true } } });
  });

  test("century table", () => {
    expect(cprCentury(0, 20)).toBe(1900);
    expect(cprCentury(3, 99)).toBe(1900);
    expect(cprCentury(4, 36)).toBe(2000);
    expect(cprCentury(4, 37)).toBe(1900);
    expect(cprCentury(9, 10)).toBe(2000);
    expect(cprCentury(9, 50)).toBe(1900);
    expect(cprCentury(5, 57)).toBe(2000);
    expect(cprCentury(8, 58)).toBe(1800);
    expect(v("DK_CPR", "0101200123")).toMatchObject({ data: { dateOfBirth: "1920-01-01" } }); // idnumbers: 2020
    expect(v("DK_CPR", "0101705123")).toMatchObject({ data: { dateOfBirth: "1870-01-01" } }); // idnumbers: 1970
    expect(v("DK_CPR", "0101104123")).toMatchObject({ data: { dateOfBirth: "2010-01-01" } });
  });

  test("rejections", () => {
    expect(v("DK_CPR", "3002601234")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("DK_CPR", "0101304123")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030
    expect(v("DK_CPR", "0113601234")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("DK_CPR", "010160123")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("DK_CVR and DK_VAT", () => {
  test("valid and invalid", () => {
    expect(v("DK_CVR", "13585628")).toMatchObject({ ok: true });
    expect(v("DK_CVR", "13585627")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("DK_VAT", "DK 13 58 56 28")).toMatchObject({ ok: true, normalized: "DK13585628", formatted: "DK 13 58 56 28" });
    expect(v("DK_VAT", "DK13585627")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});

describe("upstream comparison", () => {
  const gen = (r: () => number) => fromTemplate("[0-3]#[01]#######", r);
  const allow = (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v("DK_CPR", s);
    return !r.ok && r.reason === "invalid_date" ? "impossible or future birth date (century from 7th digit) rejected" : undefined;
  };

  test("idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DK_CPR"),
      generate: gen,
      samples: 10000,
      allow,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DK_CPR"),
      generate: gen,
      samples: 10000,
      allow,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid DK_CVR and DK_VAT", () => {
    for (const [code, tpl] of [
      ["DK_CVR", "########"],
      ["DK_VAT", "DK########"],
    ] as const) {
      const res = compareWithOracle({
        spec: spec(documents, code),
        generate: (r) => fromTemplate(tpl, r),
        samples: 5000,
      });
      expect(res.unexplained, code).toEqual([]);
      expect(res.validSeen, code).toBeGreaterThan(20);
    }
  });
});
