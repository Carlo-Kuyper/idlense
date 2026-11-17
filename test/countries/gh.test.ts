import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/gh.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const PIN = spec(documents, "GH_PIN");
const TIN = spec(documents, "GH_TIN");
describeContract(documents);

describe("GH_PIN", () => {
  test("9-digit and 8-digit forms", () => {
    expect(check(PIN, "GHA-123456789-0", REF)).toMatchObject({
      ok: true,
      normalized: "GHA1234567890",
      formatted: "GHA-123456789-0",
      data: { serial: "123456789", extra: { nationalityAtRegistration: "GHA" } },
    });
    expect(check(PIN, "gha-12345678-x", REF)).toMatchObject({ ok: true, formatted: "GHA-12345678-X", data: { serial: "12345678" } });
  });

  test("non-citizen card carries another country code", () => {
    expect(check(PIN, "NGA-123456789-1", REF)).toMatchObject({ ok: true, data: { extra: { nationalityAtRegistration: "NGA" } } });
  });

  // Published samples: GHA-000000000-0 (NIA's own placeholder) and GHA-123456789-1 (LookupTax).
  test("published samples", () => {
    expect(check(PIN, "GHA-000000000-0", REF).ok).toBe(true);
    expect(check(PIN, "GHA-123456789-1", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(PIN, "XYZ-123456789-1", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(PIN, "GH1-123456789-1", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(PIN, "GHA-1234567-1", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("GH_TIN", () => {
  test("prefix kinds", () => {
    expect(check(TIN, "C0001234560", REF)).toMatchObject({ ok: true, data: { serial: "0123456", extra: { taxpayerType: "company" } } });
    expect(check(TIN, "P000123456X", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "individual" } } });
    expect(check(TIN, "G0001234560", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "government" } } });
    expect(check(TIN, "Q0001234560", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "foreign_mission" } } });
    expect(check(TIN, "V0001234560", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "other_institution" } } });
  });

  // Published samples (LookupTax): C0001234560 (illustrative), C0002890208 (Fan Milk PLC's TIN
  // from its annual report). PL000761120 is a company registration number, not a TIN.
  test("published samples", () => {
    expect(check(TIN, "C0002890208", REF).ok).toBe(true);
    expect(check(TIN, "PL000761120", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(check(TIN, "A0001234560", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "C1001234560", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "C000123456Y", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "C000123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
