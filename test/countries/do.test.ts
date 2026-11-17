import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents, DO_CEDULA_LUHN_EXCEPTIONS, rncCheckDigit } from "../../src/countries/do.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Dominican Republic", () => {
  test("cédula", () => {
    expect(v("DO_CEDULA", "402-0000001-2")).toMatchObject({
      ok: true,
      formatted: "402-0000001-2",
      data: { citizenship: "citizen", serial: "0000001", extra: { series: "402" } },
    });
    expect(v("DO_CEDULA", "03112345677")).toMatchObject({ ok: true });
    expect(v("DO_CEDULA", "40200000013")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("DO_CEDULA", "4020000001")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("Luhn exception list", () => {
    expect(DO_CEDULA_LUHN_EXCEPTIONS.size).toBe(576);
    expect(v("DO_CEDULA", "40200401324")).toMatchObject({ ok: true, data: { extra: { luhnException: true } } });
    expect(v("DO_CEDULA", "40200401325")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("RNC", () => {
    expect(rncCheckDigit("13012345")).toBe(4);
    expect(v("DO_RNC", "1-30-12345-4")).toMatchObject({ ok: true, formatted: "1-30-12345-4" });
    expect(v("DO_RNC", "130123455")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("DO_RNC", "222222222")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("passport", () => {
    expect(v("DO_PASAPORTE", "sd1234567")).toMatchObject({ ok: true, data: { extra: { office: "SD" } } });
    expect(v("DO_PASAPORTE", "S12345678")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const cedGen = (r: () => number) => {
    if (r() < 0.05) return [...DO_CEDULA_LUHN_EXCEPTIONS][Math.floor(r() * DO_CEDULA_LUHN_EXCEPTIONS.size)]!;
    const body = fromTemplate("[0-4]#########", r);
    return r() < 0.5 ? body + luhnCheckDigit(body) : body + fromTemplate("#", r);
  };
  const exceptionFix = (s: string, ours: boolean) =>
    ours && DO_CEDULA_LUHN_EXCEPTIONS.has(s) ? "issued cédula on the Luhn exception list" : undefined;

  test("agrees with idnumbers (DOM)", () => {
    const res = compareWithOracle({ spec: spec(documents, "DO_CEDULA"), generate: cedGen });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid DO_CEDULA except the exception list", () => {
    const res = compareWithOracle({ spec: spec(documents, "DO_CEDULA"), generate: cedGen, allow: exceptionFix });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
    expect(Object.keys(res.explained).length).toBe(1);
  });

  test("agrees with nationid DO_RNC and DO_PASAPORTE", () => {
    const rnc = compareWithOracle({
      spec: spec(documents, "DO_RNC"),
      generate: (r) => {
        const body = fromTemplate("[1-5]#######", r);
        return r() < 0.5 ? body + (rncCheckDigit(body) % 10) : body + fromTemplate("#", r);
      },
    });
    expect(rnc.unexplained).toEqual([]);
    expect(rnc.validSeen).toBeGreaterThan(20);
    const pp = compareWithOracle({
      spec: spec(documents, "DO_PASAPORTE"),
      generate: (r) => fromTemplate("[A-Z1][A-Z]#######", r),
    });
    expect(pp.unexplained).toEqual([]);
    expect(pp.validSeen).toBeGreaterThan(20);
  });
});
