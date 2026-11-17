import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/za.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const ZA = spec(documents, "ZA_ID");
const validateDocument = (_code: string, s: string, ref: Date) => check(ZA, s, ref);
describeContract(documents);

const withCheck = (first12: string) => first12 + luhnCheckDigit(first12);

describe("ZA_ID", () => {
  test("extracts everything", () => {
    const r = validateDocument("ZA_ID", "8001015009087", REF);
    expect(r).toMatchObject({
      ok: true,
      formatted: "800101 5009 087",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "male", citizenship: "citizen", serial: "5009" },
    });
  });

  test("citizenship digit", () => {
    expect(validateDocument("ZA_ID", withCheck("800101400918"), REF)).toMatchObject({
      ok: true,
      data: { gender: "female", citizenship: "permanent_resident" },
    });
    // 2 = refugee per SARS in the OECD South Africa TIN sheet
    expect(validateDocument("ZA_ID", withCheck("800101500928"), REF)).toMatchObject({ ok: true, data: { citizenship: "refugee" } });
    expect(validateDocument("ZA_ID", withCheck("800101500938"), REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("century", () => {
    expect(validateDocument("ZA_ID", withCheck("150601500908"), REF)).toMatchObject({ data: { dateOfBirth: "2015-06-01" } });
    expect(validateDocument("ZA_ID", withCheck("261116500908"), REF)).toMatchObject({ data: { dateOfBirth: "2026-11-16" } });
    expect(validateDocument("ZA_ID", withCheck("261117500908"), REF)).toMatchObject({ data: { dateOfBirth: "1926-11-17" } });
    expect(validateDocument("ZA_ID", withCheck("000229500908"), REF)).toMatchObject({ data: { dateOfBirth: "2000-02-29" } });
    expect(validateDocument("ZA_ID", withCheck("010229500908"), REF)).toMatchObject({ ok: false, reason: "invalid_date" });
  });

  test("input forms", () => {
    for (const s of ["800101 5009 087", "800101-5009-087", " 8001015009087\n", "８００１０１５００９０８７"]) {
      expect(validateDocument("ZA_ID", s, REF).ok, s).toBe(true);
    }
    expect(validateDocument("ZA_ID", "8001015009086", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("ZA_ID", "800101500908", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => fromTemplate("##[01]#[0-3]#####[0-2]8#", r);

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: ZA,
      generate: gen,
      allow: (s, ours) => (ours && s[10] === "2" ? "refugee IDs (C=2) accepted" : undefined),
      samples: 10000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(100);
  });

  test("agrees with south-african-id-validator except documented fixes", () => {
    const res = compareWithOracle({
      spec: ZA,
      generate: gen,
      allow: (s, ours) => (ours && s[10] === "2" ? "refugee IDs (C=2) accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
  });
});
