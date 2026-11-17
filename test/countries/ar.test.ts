import { describe, expect, test } from "vitest";
import { cuitCheckDigit, documents } from "../../src/countries/ar.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

/** Prefix + 8-digit body, with the right check digit about half the time. */
const genKey = (prefixes: string) => (r: () => number) => {
  const first10 = fromTemplate(prefixes, r) + fromTemplate("########", r);
  const dv = cuitCheckDigit(first10);
  return first10 + (r() < 0.6 && dv !== undefined ? dv : fromTemplate("#", r));
};

describe("AR_DNI", () => {
  test("7 and 8 digits", () => {
    expect(v("AR_DNI", "30.123.456")).toMatchObject({ ok: true, formatted: "30.123.456", data: { serial: "30123456" } });
    expect(v("AR_DNI", "1.234.567")).toMatchObject({ ok: true, formatted: "1.234.567" });
    expect(v("AR_DNI", "123456")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("AR_DNI", "01234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except 7-digit DNIs", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AR_DNI"),
      generate: (r) => fromTemplate(r() < 0.3 ? "[1-9]######" : "[0-9]#######", r),
      allow: (s, ours) =>
        ours && s.length === 7 ? "7-digit DNI accepted" : !ours && s[0] === "0" ? "zero-padded DNI rejected" : undefined,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid except leading zero", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AR_DNI"),
      generate: (r) => fromTemplate(r() < 0.3 ? "[0-9]######" : "[0-9]#######", r),
      allow: (s, ours) => (!ours && s[0] === "0" ? "zero-padded DNI rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AR_CUIT / AR_CUIL / AR_CDI", () => {
  test("person and entity", () => {
    expect(v("AR_CUIT", "20-12345678-6")).toMatchObject({
      ok: true,
      formatted: "20-12345678-6",
      data: { serial: "12345678", extra: { prefix: "20", kind: "person", dni: "12345678" } },
    });
    expect(v("AR_CUIL", "20-12345678-6").ok).toBe(true);
    const ent = "3071234567";
    expect(v("AR_CUIT", ent + cuitCheckDigit(ent))).toMatchObject({ ok: true, data: { extra: { kind: "entity" } } });
    expect(v("AR_CUIL", ent + cuitCheckDigit(ent))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("no gender from the prefix (RG 5007/2021)", () => {
    const r = v("AR_CUIL", "27123456780");
    expect(r.ok).toBe(true);
    expect(r.ok ? r.data.gender : "x").toBeUndefined();
  });

  test("rejections", () => {
    expect(v("AR_CUIT", "20123456785")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("AR_CUIT", "21123456786")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("AR_CUIT", "20000000001")).toMatchObject({ ok: false, reason: "invalid_range" });
    // A body whose check digit would be 10 is never issued.
    const ten = ["2000000001", "2000000002", "2000000003", "2000000004", "2000000005", "2000000006", "2000000007", "2000000008", "2000000009"].find(
      (b) => cuitCheckDigit(b) === undefined,
    )!;
    expect(v("AR_CUIT", ten + "0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  const prefixesFix = (s: string, ours: boolean) => {
    if (ours && /^2[0347]/.test(s)) return "CDI uses natural-person prefixes (RG 5007/2021)";
    if (!ours && s.startsWith("50")) return "CDI prefix 50 not supported by any ARCA source";
    return undefined;
  };

  for (const code of ["AR_CUIT", "AR_CUIL", "AR_CDI"]) {
    test(`agrees with nationid ${code}`, () => {
      const res = compareWithOracle({
        spec: spec(documents, code),
        generate: genKey(code === "AR_CDI" ? "[2-5][0347]" : "[23][0-7]"),
        allow: code === "AR_CDI" ? prefixesFix : undefined,
        samples: 5000,
      });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    });
  }
});

describe("AR_PASAPORTE", () => {
  test("agrees with nationid", () => {
    expect(v("AR_PASAPORTE", "aaa 123456")).toMatchObject({ ok: true, normalized: "AAA123456" });
    const res = compareWithOracle({
      spec: spec(documents, "AR_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "XXXXXXXX" : "XXXXXXXXX", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
