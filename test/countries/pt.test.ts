import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/pt.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

describe("PT_NIF", () => {
  test("holder type from prefix", () => {
    expect(v("PT_NIF", "123 456 789")).toMatchObject({
      ok: true,
      formatted: "123 456 789",
      data: { extra: { holderType: "individual", person: true } },
    });
    expect(v("PT_NIF", "PT500100144")).toMatchObject({ ok: true, data: { extra: { holderType: "company", person: false } } });
    expect(v("PT_NIF", "450000001")).toMatchObject({ ok: true, data: { extra: { holderType: "non_resident_individual" } } });
  });

  test("rejections", () => {
    expect(v("PT_NIF", "123456780")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("PT_NIF", "000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("PT_NIF", "730000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("PT_NIF", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("PT_CC", () => {
  test("AMA specimen 00000000 0 ZZ4", () => {
    expect(v("PT_CC", "00000000 0 ZZ4")).toMatchObject({
      ok: true,
      normalized: "000000000ZZ4",
      formatted: "00000000 0 ZZ4",
      data: { serial: "00000000", extra: { version: "ZZ" } },
    });
    expect(v("PT_CC", "000000000zz4")).toMatchObject({ ok: true });
    expect(v("PT_CC", "000000000ZZ5")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("PT_CC", "00000000ZZZ4")).toMatchObject({ ok: false, reason: "invalid_format" });
    // idnumbers' algorithm rejects the issuer's own specimen.
  });
});

describe("upstream comparison", () => {
  const prefixFix = (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v("PT_NIF", s);
    return !r.ok && r.reason === "invalid_range" ? "unassigned NIF prefix rejected" : undefined;
  };

  test("idnumbers NIF", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PT_NIF"),
      generate: (r) => fromTemplate("#########", r),
      samples: 10000,
      allow: prefixFix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid NIF", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PT_NIF"),
      generate: (r) => fromTemplate("#########", r),
      samples: 10000,
      allow: prefixFix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid CC (shape only upstream)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "PT_CC"),
      generate: (r) => fromTemplate("#########AA#", r),
      samples: 5000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("PT_CC", s);
        return !r.ok && r.reason === "invalid_checksum" ? "AMA check digit verified (nationid checks shape only)" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
