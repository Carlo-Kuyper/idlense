import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/ca.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const withCheck = (first8: string) => first8 + luhnCheckDigit(first8);

describe("CA_SIN", () => {
  test("extracts region", () => {
    expect(validateDocument("CA_SIN", "123 456 782")).toMatchObject({
      ok: true,
      formatted: "123 456 782",
      data: { region: "1", regionName: "Atlantic provinces (NB, NS, PE, NL)", extra: { temporary: false } },
    });
    expect(validateDocument("CA_SIN", withCheck("23456789"))).toMatchObject({ ok: true, data: { regionName: "Quebec" } });
  });

  test("9 = temporary resident", () => {
    expect(validateDocument("CA_SIN", withCheck("93456789"))).toMatchObject({
      ok: true,
      data: { citizenship: "temporary_resident", region: "9", extra: { temporary: true } },
    });
  });

  test("rejections", () => {
    expect(validateDocument("CA_SIN", "123-456-789")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument("CA_SIN", withCheck("04645428"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(validateDocument("CA_SIN", withCheck("83456789"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(validateDocument("CA_SIN", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  /** Our fix: first digit 0 (CRA tax numbers) and 8 (business numbers) are not SINs. */
  const fix = (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = validateDocument("CA_SIN", s);
    return !r.ok && r.reason === "invalid_range" && /^[08]/.test(r.normalized) ? "first digit 0/8 is not a SIN" : undefined;
  };
  const gen = (r: () => number) => fromTemplate("###-###-###", r);

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CA_SIN"),
      generate: gen,
      samples: 10000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CA_SIN"),
      generate: gen,
      samples: 10000,
      allow: fix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CA_BN", () => {
  test("root and program account", () => {
    expect(validateDocument("CA_BN", "123456789")).toMatchObject({ ok: true, data: { extra: { root: "123456789" } } });
    expect(validateDocument("CA_BN", "123456789 rt 0001")).toMatchObject({
      ok: true,
      formatted: "123456789 RT0001",
      data: { extra: { root: "123456789", programId: "RT", reference: "0001" } },
    });
    expect(validateDocument("CA_BN", "123456789XX0001")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CA_BN"),
      generate: (r) => (r() < 0.3 ? fromTemplate("#########", r) : fromTemplate("#########R[TPCMRZX]####", r)),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CA_PASAPORTE", () => {
  test("format", () => {
    expect(validateDocument("CA_PASAPORTE", "ab123456")).toMatchObject({ ok: true, normalized: "AB123456" });
    expect(validateDocument("CA_PASAPORTE", "A1234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CA_PASAPORTE"),
      generate: (r) => fromTemplate("[A-Z0-9]X######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
