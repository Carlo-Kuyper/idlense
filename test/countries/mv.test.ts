import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mv.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TIN = spec(documents, "MV_TIN");

describe("MV_TIN", () => {
  // Specimens from MIRA's OECD TIN sheet: BP 1000001 with each revenue code.
  test("published specimens", () => {
    for (const s of ["1000001BIT001", "1000001IIT001", "1000001PIT001", "1000001CIT001", "1000001EWT001", "1000001NWT001", "1000001GST501", "1000001GST001", "1000001GST901", "1000001GRT001"]) {
      expect(check(TIN, s).ok, s).toBe(true);
    }
    expect(check(TIN, "1000001gst501")).toMatchObject({
      ok: true,
      normalized: "1000001GST501",
      data: { serial: "1000001", extra: { businessPartnerNumber: "1000001", taxType: "GST", registration: "501" } },
    });
  });

  test("bare business partner number", () => {
    expect(check(TIN, "1000001")).toMatchObject({ ok: true, data: { serial: "1000001", extra: { businessPartnerNumber: "1000001" } } });
  });

  test("rejections", () => {
    expect(check(TIN, "1000001GS5501")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "A000001GST501")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "1000001GST50")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
