import { describe, expect, test } from "vitest";
import { documents, HN_DEPARTMENTS } from "../../src/countries/hn.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("HN_DNI", () => {
  test("extracts everything", () => {
    expect(v("HN_DNI", "0801-1990-12345")).toMatchObject({
      ok: true,
      formatted: "0801-1990-12345",
      data: { region: "0801", regionName: "Francisco Morazán", serial: "12345", extra: { registrationYear: 1990 } },
    });
    expect(v("HN_DNI", "0501200000001")).toMatchObject({ ok: true, data: { regionName: "Cortés", extra: { registrationYear: 2000 } } });
  });

  test("digits 5-8 are the registration year, not a birth year (Sayari)", () => {
    const r = v("HN_DNI", "0801199012345");
    expect(r.ok && r.data.birthYear).toBe(undefined);
    expect(r.ok && r.data.dateOfBirth).toBe(undefined);
  });

  test("rejections", () => {
    expect(v("HN_DNI", "0907199012345")).toMatchObject({ ok: false, reason: "invalid_range" }); // Gracias a Dios has 6
    expect(v("HN_DNI", "1901199012345")).toMatchObject({ ok: false, reason: "invalid_format" }); // no department 19
    expect(v("HN_DNI", "0801202712345")).toMatchObject({ ok: false, reason: "invalid_date" }); // future registration year
    expect(v("HN_DNI", "080119901234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("298 municipalities", () => {
    expect(HN_DEPARTMENTS.reduce((a, [, n]) => a + n, 0)).toBe(298);
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "HN_DNI"),
      generate: (r) => fromTemplate("[01]#[0-3]#[12][09]#######", r),
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("HN_DNI", s);
        if (r.ok) return undefined;
        if (r.reason === "invalid_date") return "future birth year rejected";
        if (r.reason === "invalid_range") return "municipality beyond the department's count";
        if (r.reason === "invalid_format" && Number(s.slice(2, 4)) > 28) return "municipality beyond the department's count";
        if (r.reason === "invalid_format" && s.slice(2, 4) === "00") return "municipality 00 rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("HN_RTN", () => {
  test("shape", () => {
    expect(v("HN_RTN", "0801-1990-123456")).toMatchObject({ ok: true, formatted: "0801-1990-123456" });
    expect(v("HN_RTN", "11111111111111")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "HN_RTN"),
      generate: (r) => (r() < 0.05 ? fromTemplate("#", r).repeat(14) : fromTemplate("##############", r)),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("HN_PASAPORTE", () => {
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "HN_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "[A-Z0-9]#######" : "[A-Z0-9]########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
