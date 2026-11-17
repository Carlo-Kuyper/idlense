import { describe, expect, test } from "vitest";
import { acnCheckDigit } from "../../src/countries/au.js";
import { documents } from "../../src/countries/au.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("AU_TFN", () => {
  test("valid and formatted", () => {
    expect(v("AU_TFN", "123 456 782")).toMatchObject({ ok: true, formatted: "123 456 782", data: { extra: {} } });
    expect(v("AU_TFN", "123456783")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("AU_TFN", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers on 9-digit TFNs", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AU_TFN"),
      generate: (r) => fromTemplate("#########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AU_ABN / AU_ACN", () => {
  test("ABR and ASIC examples", () => {
    expect(v("AU_ABN", "51 824 753 556")).toMatchObject({ ok: true, formatted: "51 824 753 556" });
    expect(v("AU_ABN", "51824753557")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("AU_ABN", "01824753556")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("AU_ACN", "000 250 000")).toMatchObject({ ok: true, formatted: "000 250 000" });
    expect(v("AU_ACN", "000250001")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(acnCheckDigit("12345678")).toBe(0); // ASIC page example ACN 123 456 780 style
    expect(v("AU_ACN", "123456780").ok).toBe(true);
  });
});

describe("AU_MEDICARE", () => {
  test("issue number and IRN", () => {
    expect(v("AU_MEDICARE", "2123 45670 1")).toMatchObject({
      ok: true,
      formatted: "2123 45670 1",
      data: { serial: "21234567", extra: { issueNumber: 1 } },
    });
    expect(v("AU_MEDICARE", "2123 45670 1/3")).toMatchObject({ ok: true, data: { extra: { issueNumber: 1, irn: 3 } } });
    expect(v("AU_MEDICARE", "2123456711")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("AU_MEDICARE", "7123456701")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("issue number and IRN are 1-9 (Services Australia)", () => {
    expect(v("AU_MEDICARE", "2123456709")).toMatchObject({ ok: true, data: { extra: { issueNumber: 9 } } });
    expect(v("AU_MEDICARE", "21234567019")).toMatchObject({ ok: true, data: { extra: { issueNumber: 1, irn: 9 } } });
    expect(v("AU_MEDICARE", "2123456700")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("AU_MEDICARE", "21234567010")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("AU_MEDICARE", "21234567001")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AU_MEDICARE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "[2-6]#########" : "[2-6]##########", r),
      samples: 5000,
      allow: (s, ours, theirs) =>
        !ours && theirs && /^\d{9}(0|0\d|\d0)$/.test(s) ? "issue number / IRN 0 rejected (Services Australia: 1-9)" : undefined,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AU_DL", () => {
  test("shapes", () => {
    for (const s of ["12345678", "123456789", "1234567890", "A12345"]) expect(v("AU_DL", s).ok, s).toBe(true);
    expect(v("AU_DL", "1234567")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("AU_DL", "AB1234")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except the repeated-digit heuristic", () => {
    const res = compareWithOracle({
      spec: spec(documents, "AU_DL"),
      generate: (r) => {
        const t = ["A#####", "########", "#########", "##########", "###11111"][Math.floor(r() * 5)]!;
        return fromTemplate(t, r);
      },
      allow: (s, ours) => (ours && /(\d)\1{4}$/.test(s) ? "repeated trailing digits not rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
