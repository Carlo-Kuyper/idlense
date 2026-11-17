import { describe, expect, test } from "vitest";
import { documents, fjTinCheckDigit } from "../../src/countries/fj.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TIN = spec(documents, "FJ_TIN");
const TPOS = spec(documents, "FJ_TIN_TPOS");
const withCheck = (first8: string) => first8 + fjTinCheckDigit(first8);

describe("FJ_TIN", () => {
  // Company TINs published by FRCS (public notice, Dec 2018) and USP's 2025 tax clearance certificate.
  test("published company TINs", () => {
    expect(check(TIN, "500852206")).toMatchObject({ ok: true, data: { serial: "085220", extra: { taxpayerType: "company" } } }); // Sugar City Pharmacy Ltd
    expect(check(TIN, "500936205").ok).toBe(true); // Yees Cold Storage Seafood Ltd
    expect(check(TIN, "501186009").ok).toBe(true); // CUL (Fiji) Ltd
    expect(check(TIN, "600048307")).toMatchObject({ ok: true, data: { extra: { taxpayerType: "non_profit" } } }); // University of the South Pacific
  });

  test("worked check digit", () => {
    // 5·3 + 0 + 0·3 + 8 + 5·3 + 2 + 2·3 + 0 = 46 → 6
    expect(fjTinCheckDigit("50085220")).toBe(6);
  });

  test("registration types", () => {
    expect(check(TIN, withCheck("01000001"))).toMatchObject({ ok: true, data: { extra: { taxpayerType: "individual" } } });
    expect(check(TIN, withCheck("26000001"))).toMatchObject({ ok: true, data: { extra: { taxpayerType: "individual" } } });
    for (const [p, t] of [["30", "partnership"], ["40", "shipping_insurance"], ["70", "estate"], ["75", "trust"], ["80", "cooperative"], ["90", "government"]]) {
      expect(check(TIN, withCheck(p + "000001"))).toMatchObject({ ok: true, data: { extra: { taxpayerType: t } } });
    }
  });

  test("rejections", () => {
    expect(check(TIN, "500852207")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(TIN, withCheck("27000001"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(TIN, withCheck("00000001"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(TIN, "50085220")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("FJ_TIN_TPOS", () => {
  test("10 digits starting 29", () => {
    expect(check(TPOS, "2900012345")).toMatchObject({ ok: true, data: { serial: "00012345" } });
  });

  test("rejections", () => {
    expect(check(TPOS, "3900012345")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TPOS, "290001234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
