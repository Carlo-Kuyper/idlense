import { describe, expect, test } from "vitest";
import { documents, norwayCentury } from "../../src/countries/no.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date) => check(spec(documents, code), s, ref);
describeContract(documents);

describe("Norway", () => {
  test("fødselsnummer", () => {
    expect(validateDocument("NO_FNR", "17054026641", REF)).toMatchObject({
      ok: true,
      formatted: "170540 26641",
      data: { dateOfBirth: "1940-05-17", gender: "female", serial: "266" },
    });
  });

  test("D-, H- and FH-numbers", () => {
    expect(validateDocument("NO_DNR", "57054026635", REF)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1940-05-17", citizenship: "foreigner" },
    });
    expect(validateDocument("NO_HNR", "17454026624", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1940-05-17" } });
    expect(validateDocument("NO_FHN", "81234567802", REF)).toMatchObject({ ok: true, data: {} });
  });

  test("century table", () => {
    expect(norwayCentury(123, 80)).toBe(1900);
    expect(norwayCentury(600, 60)).toBe(1800);
    expect(norwayCentury(600, 10)).toBe(2000);
    expect(norwayCentury(950, 45)).toBe(1900);
    expect(norwayCentury(800, 45)).toBeUndefined(); // unissued; upstream reads 2045
    expect(norwayCentury(600, 45)).toBeUndefined(); // unissued
  });

  const gen = (r: () => number) => fromTemplate("[0-3]#[01]########", r);
  /**
   * Our fixes: we reject unissued individnummer/year combinations, impossible
   * dates (nationid only checks day ≤ 31) and future birth dates. Only those
   * rejection reasons are excused; a checksum disagreement is never allowed.
   */
  const fixFor = (code: string) => (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = validateDocument(code, s, REF);
    if (r.ok) return undefined;
    if (r.reason === "invalid_range") return "unissued century range rejected";
    if (r.reason === "invalid_date") return "impossible or future birth date rejected";
    return undefined;
  };
  const fix = fixFor("NO_FNR");

  test("agrees with norwegian-national-id-validator except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NO_FNR"),
      generate: gen,
      samples: 20000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen, "generator must produce valid numbers").toBeGreaterThan(20);
    expect(res.validSeen).toBeGreaterThan(50);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NO_FNR"),
      generate: gen,
      samples: 20000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen, "generator must produce valid numbers").toBeGreaterThan(20);
  });

  test("agrees with nationid NO_DNR", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NO_DNR"),
      generate: (r) => fromTemplate("[4-7]#[01]########", r),
      samples: 20000,
      allow: fixFor("NO_DNR"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen, "generator must produce valid numbers").toBeGreaterThan(20);
  });
});
