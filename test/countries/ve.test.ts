import { describe, expect, test } from "vitest";
import { documents, rifCheckDigit } from "../../src/countries/ve.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("Venezuela", () => {
  test("cédula", () => {
    expect(v("VE_CEDULA", "V-12.345.678")).toMatchObject({
      ok: true,
      formatted: "V-12345678",
      data: { citizenship: "citizen", serial: "12345678" },
    });
    expect(v("VE_CEDULA", "e-1234567")).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(v("VE_CEDULA", "J-12345678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("VE_CEDULA", "V-123456789")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("RIF", () => {
    expect(v("VE_RIF", "J-12345678-4")).toMatchObject({
      ok: true,
      formatted: "J-12345678-4",
      data: { serial: "12345678", extra: { kind: "legal_person", checkDigit: 4 } },
    });
    const vrif = "V12345678" + rifCheckDigit("V", "12345678");
    expect(v("VE_RIF", vrif)).toMatchObject({ ok: true, data: { citizenship: "citizen", extra: { kind: "natural_person" } } });
    expect(v("VE_RIF", "J-12345678-5")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("VE_RIF", "C-12345678-4")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("passport", () => {
    expect(v("VE_PASAPORTE", "123456789")).toMatchObject({ ok: true });
    expect(v("VE_PASAPORTE", "1234567")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const cedGen = (r: () => number) => fromTemplate(r() < 0.5 ? "[VEJGP]#######" : "[VEJGP]########", r);
  /** Fix: J/G/P are RIF prefixes, not cédulas. */
  const cedFix = (s: string, ours: boolean) => (!ours && /^[JGP]/.test(s) ? "RIF-only prefix rejected as cédula" : undefined);

  test("agrees with idnumbers (VEN cédula)", () => {
    const res = compareWithOracle({ spec: spec(documents, "VE_CEDULA"), generate: cedGen, allow: cedFix });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid VE_CEDULA and VE_PASAPORTE", () => {
    const ced = compareWithOracle({ spec: spec(documents, "VE_CEDULA"), generate: cedGen });
    expect(ced.unexplained).toEqual([]);
    expect(ced.validSeen).toBeGreaterThan(20);
    const pp = compareWithOracle({
      spec: spec(documents, "VE_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "[0-9A]#######" : "[0-9A]########", r),
    });
    expect(pp.unexplained).toEqual([]);
    expect(pp.validSeen).toBeGreaterThan(20);
  });

  const rifGen = (r: () => number) => {
    const letter = fromTemplate("[VEJPGC]", r);
    const body = fromTemplate("########", r);
    const dv = rifCheckDigit(letter === "C" ? "J" : letter, body)!;
    return letter + body + (r() < 0.5 ? dv : fromTemplate("#", r));
  };
  const rifFix = (s: string, ours: boolean) => (!ours && s[0] === "C" ? "prefix C rejected (letter value unverified)" : undefined);

  test("agrees with nationid VE_RIF except prefix C", () => {
    const res = compareWithOracle({ spec: spec(documents, "VE_RIF"), generate: rifGen, allow: rifFix });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers FiscalInformationNumber", () => {
    const res = compareWithOracle({ spec: spec(documents, "VE_RIF"), generate: rifGen });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
