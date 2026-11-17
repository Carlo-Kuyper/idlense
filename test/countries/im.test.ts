import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/im.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TRN = spec(documents, "IM_TRN");
describeContract(documents);

describe("IM_TRN", () => {
  // Published samples (Isle of Man OECD TIN sheet): H111111-11, C333333-33, X555555-55, C222222.
  test("published samples", () => {
    expect(check(TRN, "H111111-11", REF)).toMatchObject({
      ok: true,
      normalized: "H11111111",
      formatted: "H111111-11",
      data: { serial: "111111", extra: { prefix: "H", suffix: "11" } },
    });
    expect(check(TRN, "C333333-33", REF)).toMatchObject({ ok: true, data: { extra: { prefix: "C", suffix: "33" } } });
    expect(check(TRN, "X555555-55", REF)).toMatchObject({ ok: true, data: { extra: { prefix: "X" } } });
    expect(check(TRN, "C222222", REF)).toMatchObject({
      ok: true,
      formatted: "C222222",
      data: { serial: "222222", extra: { prefix: "C" } },
    });
  });

  test("suffix is optional", () => {
    expect(check(TRN, "h123456", REF)).toMatchObject({ ok: true, data: { serial: "123456", extra: { prefix: "H" } } });
    expect(check(TRN, "h123456", REF)).not.toMatchObject({ data: { extra: { suffix: expect.anything() } } });
  });

  test("rejections", () => {
    expect(check(TRN, "1111111-11", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "HH11111", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "H111111-1", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    // The VAT number (100-xxxx-xxx) is not accepted as a TIN.
    expect(check(TRN, "100-1234-567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
