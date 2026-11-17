import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/aw.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const ID = spec(documents, "AW_ID");
const TIN = spec(documents, "AW_PERSOONSNUMMER");
describeContract(documents);

describe("AW_ID", () => {
  // Published sample: 1965.12.12.40 (Aruba government, toelichting personeelsregister 2022-2023).
  test("published sample", () => {
    expect(check(ID, "1965.12.12.40", REF)).toMatchObject({
      ok: true,
      normalized: "1965121240",
      formatted: "1965.12.12.40",
      data: { dateOfBirth: "1965-12-12", birthYear: 1965, serial: "40", extra: {} },
    });
  });

  test("rejections", () => {
    expect(check(ID, "2027.01.01.01", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(ID, "1965.02.30.01", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(ID, "1965.13.12.40", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ID, "1765.12.12.40", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    // Unregistered employees are reported as the bare date plus an asterisk; that is not a number.
    expect(check(ID, "1965.12.12.*", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("AW_PERSOONSNUMMER", () => {
  test("7 and 8 digits", () => {
    expect(check(TIN, "12345678", REF)).toMatchObject({ ok: true, data: { serial: "12345678" } });
    expect(check(TIN, "1234567", REF)).toMatchObject({ ok: true, data: { serial: "1234567" } });
  });

  test("rejections", () => {
    expect(check(TIN, "123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
