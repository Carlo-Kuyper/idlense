import { describe, expect, test } from "vitest";
import { codeMelliCheckDigit, documents } from "../../src/countries/ir.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const IR = spec(documents, "IR_NID");
describeContract(documents);

describe("IR_NID", () => {
  test("valid numbers", () => {
    expect(check(IR, "0012345679")).toMatchObject({
      ok: true,
      formatted: "001-234567-9",
      data: { region: "001", serial: "234567", extra: {} },
    });
    expect(check(IR, "001-234567-9").ok).toBe(true);
    expect(check(IR, "1234567891").ok).toBe(true);
  });

  test("dropped leading zeros are restored", () => {
    expect(check(IR, "12345679")).toMatchObject({ ok: true, normalized: "0012345679" });
    expect(check(IR, "012345679")).toMatchObject({ ok: true, normalized: "0012345679" });
    expect(check(IR, "1234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("rejections", () => {
    expect(check(IR, "0012345678")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // passes the check digit but is a placeholder
    expect(codeMelliCheckDigit("111111111")).toBe(1);
    expect(check(IR, "1111111111")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IR, "0000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IR, "00123456790")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except repeated-digit numbers", () => {
    const res = compareWithOracle({
      spec: IR,
      generate: (r) => {
        if (r() < 0.02) return String(Math.floor(r() * 10)).repeat(10);
        const body = fromTemplate("#########", r);
        return r() < 0.5 ? body + codeMelliCheckDigit(body) : fromTemplate("##########", r);
      },
      allow: (s, ours) => (!ours && /^(\d)\1{9}$/.test(s) ? "repeated-digit placeholder rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(res.explained).toHaveProperty("repeated-digit placeholder rejected");
  });
});
