import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bo.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const varLen = (tpl: string, min: number, max: number) => (r: () => number) =>
  fromTemplate(tpl, r).slice(0, min + Math.floor(r() * (max - min + 1)));

describe("Bolivia", () => {
  test("CI with and without department", () => {
    expect(validateDocument("BO_CI", "1234567 LP")).toMatchObject({
      ok: true,
      normalized: "1234567LP",
      formatted: "1234567 LP",
      data: { serial: "1234567", region: "LP", regionName: "La Paz" },
    });
    expect(validateDocument("BO_CI", "1234567-sc")).toMatchObject({ ok: true, data: { regionName: "Santa Cruz" } });
    expect(validateDocument("BO_CI", "1234567")).toMatchObject({ ok: true, data: { serial: "1234567" } });
    expect(validateDocument("BO_CI", "1234567")).not.toHaveProperty("data.region");
    expect(validateDocument("BO_CI", "1234567 XX")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(validateDocument("BO_CI", "12345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("NIT and passport", () => {
    expect(validateDocument("BO_NIT", "1020703023")).toMatchObject({ ok: true });
    expect(validateDocument("BO_NIT", "123456")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(validateDocument("BO_PASAPORTE", "ab123456")).toMatchObject({ ok: true, normalized: "AB123456" });
    expect(validateDocument("BO_PASAPORTE", "AB12345!")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const cases = [
    ["BO_CI", (r: () => number) => varLen("##########", 5, 10)(r) + (r() < 0.5 ? "" : ["LP", "SC", "BE", "PA", "XX", "BN"][Math.floor(r() * 6)])],
    ["BO_NIT", varLen("##############", 6, 14)],
    ["BO_PASAPORTE", varLen("XXXXXXXXXX", 5, 10)],
  ] as const;
  for (const [code, generate] of cases) {
    test(`${code} agrees with nationid`, () => {
      const res = compareWithOracle({ spec: spec(documents, code), generate });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    });
  }
});
