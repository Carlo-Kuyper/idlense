import { describe, expect, test } from "vitest";
import { documents, pyRucCheckDigit } from "../../src/countries/py.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string, ref: Date = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const varLen = (tpl: string, min: number, max: number) => (r: () => number) =>
  fromTemplate(tpl, r).slice(0, min + Math.floor(r() * (max - min + 1)));

describe("Paraguay", () => {
  test("CI", () => {
    expect(validateDocument("PY_CI", "1.234.567")).toMatchObject({ ok: true, normalized: "1234567", formatted: "1.234.567" });
    expect(validateDocument("PY_CI", "12345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RUC", () => {
    expect(validateDocument("PY_RUC", "80000000-5")).toMatchObject({ ok: true, formatted: "80000000-5", data: { serial: "80000000" } });
    expect(validateDocument("PY_RUC", "44444401-7")).toMatchObject({ ok: true });
    expect(validateDocument("PY_RUC", "80000000-4")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(pyRucCheckDigit("000006")).toBe(0); // remainder 1 → 0
    expect(validateDocument("PY_RUC", "123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("passport", () => {
    expect(validateDocument("PY_PASAPORTE", "a1234567")).toMatchObject({ ok: true, normalized: "A1234567" });
  });

  const cases = [
    ["PY_CI", varLen("##########", 5, 10)],
    ["PY_RUC", varLen("###########", 6, 11)],
    ["PY_PASAPORTE", varLen("XXXXXXXXXX", 5, 10)],
  ] as const;
  for (const [code, generate] of cases) {
    test(`${code} agrees with nationid`, () => {
      const res = compareWithOracle({ spec: spec(documents, code), generate, samples: 8000 });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    });
  }
});
