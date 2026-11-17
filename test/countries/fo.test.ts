import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/fo.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const PTAL = spec(documents, "FO_PTAL");
describeContract(documents);

describe("FO_PTAL", () => {
  test("extracts date of birth, gender and serial", () => {
    expect(check(PTAL, "150385-124", REF)).toMatchObject({
      ok: true,
      normalized: "150385124",
      formatted: "150385-124",
      data: { dateOfBirth: "1985-03-15", birthYear: 1985, gender: "female", serial: "124", extra: {} },
    });
    expect(check(PTAL, "010120 123", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "2020-01-01", gender: "male" } });
  });

  test("century is the latest one that gives a past date", () => {
    // REF is 2026-11-16: YY 26 with a later date falls back to 1926.
    expect(check(PTAL, "011226-001", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1926-12-01" } });
    expect(check(PTAL, "011126-001", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "2026-11-01" } });
  });

  // The OECD sheet gives only the pattern "ddmmyy-xxx"; no concrete specimen is published.
  test("rejections", () => {
    expect(check(PTAL, "300285-123", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(PTAL, "290201-123", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(PTAL, "151385-123", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(PTAL, "320185-123", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(PTAL, "150385-1234", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    // A Danish CPR number has 10 digits.
    expect(check(PTAL, "0101601234", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
