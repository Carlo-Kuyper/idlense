import { describe, expect, test } from "vitest";
import { documents, twCheckDigit } from "../../src/countries/tw.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const full = (first9: string) => first9 + twCheckDigit(first9);
describeContract(documents);

describe("TW_NIC", () => {
  test("extracts everything", () => {
    expect(v("TW_NIC", "A123456789")).toMatchObject({
      ok: true,
      data: { gender: "male", citizenship: "citizen", region: "A", regionName: "Taipei City", serial: "2345678" },
    });
    expect(v("TW_NIC", full("O20000000"))).toMatchObject({ ok: true, data: { gender: "female", regionName: "Hsinchu City" } });
    expect(v("TW_NIC", "a123456789").ok).toBe(true);
  });

  test("rejections", () => {
    expect(v("TW_NIC", "A123456788")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("TW_NIC", "A323456789")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("TW_NIC", "A12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "TW_NIC"),
      generate: (r) => fromTemplate("A[12]########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("TW_ARC", () => {
  test("2021 format", () => {
    // National Immigration Agency's own example: new A800000014 ↔ old AC0****014
    expect(v("TW_ARC", "A800000014")).toMatchObject({
      ok: true,
      data: {
        gender: "male",
        citizenship: "foreigner",
        region: "A",
        serial: "000001",
        extra: { format: "2021", kind: "foreigner" },
      },
    });
    expect(v("TW_ARC", full("F99123456"))).toMatchObject({
      ok: true,
      data: { gender: "female", citizenship: "mainland_resident", extra: { kind: "mainland-resident" } },
    });
    expect(v("TW_ARC", full("F97123456"))).toMatchObject({ ok: true, data: { citizenship: "citizen" } });
    expect(v("TW_ARC", full("F88123456"))).toMatchObject({ ok: true, data: { extra: { kind: "hong-kong-macao-resident" } } });
  });

  test("legacy two-letter format", () => {
    // Second letter contributes its units digit: C = 12 → 2.
    const c = full("FC1234567");
    expect(v("TW_ARC", c)).toMatchObject({
      ok: true,
      data: { gender: "male", citizenship: "foreigner", serial: "1234567", extra: { format: "legacy", kind: "foreigner" } },
    });
    expect(v("TW_ARC", full("FB1234567"))).toMatchObject({ ok: true, data: { gender: "female", citizenship: "resident" } });
    expect(v("TW_ARC", full("FD1234567"))).toMatchObject({ ok: true, data: { gender: "female", citizenship: "foreigner" } });
    // Hand-computed: F=15 → 1,5; C → 2; weights 1,9,8,...: 1+45+16+7+12+15+16+15+12+7 = 146 → check 4.
    expect(c).toBe("FC12345674");
  });

  test("rejections", () => {
    expect(v("TW_ARC", "A800000015")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("TW_ARC", "AE12345678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("TW_ARC", "A123456789")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("TW_UBN", () => {
  test("mod-5 rule and the 7th-digit-7 case", () => {
    expect(v("TW_UBN", "04595257")).toMatchObject({ ok: true }); // sum 40
    expect(v("TW_UBN", "12345601")).toMatchObject({ ok: true }); // sum 25: valid only under the 2023 mod-5 rule
    expect(v("TW_UBN", "12345602")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    // 7th digit 7: 28 → 10 counts as 1 too. 1,4,3,8,5,(12→3),(28→10) = 34; + 0 → 34+1 = 35.
    expect(v("TW_UBN", "12345670")).toMatchObject({ ok: true });
    expect(v("TW_UBN", "12345672")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});
