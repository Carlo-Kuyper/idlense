import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ao.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const BI = spec(documents, "AO_BI");
describeContract(documents);

describe("AO_BI", () => {
  // Illustrative number from https://lookuptax.com/docs/tax-identification-number/angola-tax-id-guide
  test("published illustration", () => {
    expect(check(BI, "000000000LA000", REF)).toMatchObject({
      ok: true,
      data: { serial: "000000000", extra: { letterCode: "LA" } },
    });
  });

  test("lower case and spaces", () => {
    expect(check(BI, "123456789 la 012", REF)).toMatchObject({ ok: true, normalized: "123456789LA012" });
  });

  test("rejections", () => {
    expect(check(BI, "1234567890A012", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BI, "123456789L0012", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(BI, "123456789LA01", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(BI, "5410003691", REF)).toMatchObject({ ok: false, reason: "invalid_length" }); // a company NIF
  });
});
