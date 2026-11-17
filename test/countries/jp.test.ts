import { describe, expect, test } from "vitest";
import { corporateCheckDigit, documents, myNumberCheckDigit } from "../../src/countries/jp.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("JP_MY_NUMBER", () => {
  test("valid numbers", () => {
    expect(validateDocument("JP_MY_NUMBER", "1234 5678 9018")).toMatchObject({
      ok: true,
      normalized: "123456789018",
      formatted: "1234 5678 9018",
      data: { extra: {} },
    });
    // r ≤ 1 → check digit 0
    const body = "00000000001"; // sum = 2 → r = 2 → 9
    expect(myNumberCheckDigit(body)).toBe(9);
    expect(myNumberCheckDigit("00000000000")).toBe(0);
    expect(validateDocument("JP_MY_NUMBER", "000000000000").ok).toBe(true);
  });

  test("rejections", () => {
    expect(validateDocument("JP_MY_NUMBER", "123456789017")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("JP_MY_NUMBER", "12345678901")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (r: () => number) => fromTemplate("############", r);

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "JP_MY_NUMBER"),
      generate: gen,
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "JP_MY_NUMBER"),
      generate: gen,
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("JP_CORPORATE_NUMBER", () => {
  test("NTA's own number", () => {
    expect(validateDocument("JP_CORPORATE_NUMBER", "7000012050002")).toMatchObject({
      ok: true,
      data: { serial: "000012050002" },
    });
    // S mod 9 = 0 gives 9, never 0
    expect(corporateCheckDigit("000000000000")).toBe(9);
    expect(validateDocument("JP_CORPORATE_NUMBER", "9000000000000").ok).toBe(true);
  });

  test("rejections", () => {
    expect(validateDocument("JP_CORPORATE_NUMBER", "8000012050002")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("JP_CORPORATE_NUMBER", "0000012050002")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "JP_CORPORATE_NUMBER"),
      generate: (r) => fromTemplate("#############", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
