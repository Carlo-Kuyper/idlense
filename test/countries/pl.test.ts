import { describe, expect, test } from "vitest";
import { weightedSum } from "../../src/core/algorithms.js";
import { documents, peselCentury } from "../../src/countries/pl.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const pesel = (b: string) => b + ((10 - (weightedSum(b, [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]) % 10)) % 10);

describe("PL_PESEL", () => {
  test("extracts everything", () => {
    expect(v("PL_PESEL", "80010112340")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "female", serial: "1234", extra: {} },
    });
    expect(v("PL_PESEL", pesel("0225010125"))).toMatchObject({ ok: true, data: { dateOfBirth: "2002-05-01", gender: "male" } });
  });

  test("century offsets", () => {
    expect(peselCentury(1)).toEqual([1900, 1]);
    expect(peselCentury(32)).toEqual([2000, 12]);
    expect(peselCentury(41)).toEqual([2100, 1]);
    expect(peselCentury(72)).toEqual([2200, 12]);
    expect(peselCentury(81)).toEqual([1800, 1]);
    expect(peselCentury(13)).toBeUndefined();
    expect(v("PL_PESEL", pesel("9981150001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1899-01-15" } });
    expect(v("PL_PESEL", pesel("0041010001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2100
    expect(v("PL_PESEL", pesel("0061010001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2200
  });

  test("rejections", () => {
    expect(v("PL_PESEL", "80010112341")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("PL_PESEL", pesel("8002300001"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("PL_PESEL", "80130112340")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("PL_PESEL", "8001011234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => {
    const b = fromTemplate("##[0-9]#[0-3]#####", r);
    return r() < 0.5 ? pesel(b) : b + fromTemplate("#", r);
  };
  const fix = (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v("PL_PESEL", s);
    return !r.ok && r.reason === "invalid_date" ? "impossible or future birth date rejected" : undefined;
  };

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PL_PESEL"),
      generate: gen,
      samples: 20000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PL_PESEL"),
      generate: gen,
      samples: 20000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("PL_NIP", () => {
  test("valid and invalid", () => {
    expect(v("PL_NIP", "123-456-32-18")).toMatchObject({ ok: true, formatted: "123-456-32-18", data: { region: "123" } });
    expect(v("PL_NIP", "1234563219")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // remainder 10 is never issued
    expect(v("PL_NIP", "5260001230")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PL_NIP"),
      generate: (r) => {
        const b = fromTemplate("#########", r);
        return b + String((weightedSum(b, [6, 5, 7, 2, 3, 4, 5, 6, 7]) % 11) % 10);
      },
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("PL_REGON", () => {
  const r9 = (b: string) => b + ((weightedSum(b, [8, 9, 2, 3, 4, 5, 6, 7]) % 11) % 10);
  const r14 = (b: string) => b + ((weightedSum(b, [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8]) % 11) % 10);

  test("9 and 14 digits", () => {
    expect(v("PL_REGON", "123456785")).toMatchObject({ ok: true, data: { extra: { localUnit: false } } });
    expect(v("PL_REGON", r14("1234567851234"))).toMatchObject({ ok: true, data: { extra: { localUnit: true } } });
    expect(v("PL_REGON", r14("1234567861234"))).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("PL_REGON", "123456786")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("PL_REGON", "1234567851")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PL_REGON"),
      generate: (r) => {
        const b = r9(fromTemplate("########", r));
        if (r() < 0.4) return r() < 0.7 ? b : fromTemplate("#########", r);
        return r() < 0.7 ? r14(b + fromTemplate("####", r)) : b + fromTemplate("#####", r);
      },
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
