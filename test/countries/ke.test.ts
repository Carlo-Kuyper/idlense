import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ke.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const KE = spec(documents, "KE_PIN");
describeContract(documents);

describe("KE_PIN", () => {
  test("individual and non-individual", () => {
    expect(check(KE, "A123456789Z", REF)).toMatchObject({
      ok: true,
      data: { serial: "123456789", extra: { taxpayerType: "individual" } },
    });
    expect(check(KE, "p123456789z", REF)).toMatchObject({
      ok: true,
      normalized: "P123456789Z",
      data: { extra: { taxpayerType: "non_individual" } },
    });
  });

  // Samples from python-stdnum's documentation (https://arthurdejong.org/python-stdnum/doc/2.0/stdnum.ke.pin).
  test("published samples", () => {
    expect(check(KE, "P051365947M", REF).ok).toBe(true);
    expect(check(KE, "A004416331M", REF).ok).toBe(true);
    expect(check(KE, "a004416331m", REF).ok).toBe(true);
    expect(check(KE, "12345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(KE, "V1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(check(KE, "B123456789Z", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(KE, "A1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(KE, "A12345678Z", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("KE_ID", () => {
  const ID = spec(documents, "KE_ID");

  // Request examples from Dojah's docs (https://docs.dojah.io/api-reference/individual-verification/kenya/national-id.md)
  test("published samples", () => {
    expect(check(ID, "12345678", REF)).toMatchObject({ ok: true, data: { serial: "12345678", citizenship: "citizen" } });
    expect(check(ID, "123456789", REF).ok).toBe(true);
  });

  test("short older numbers", () => {
    expect(check(ID, "123 456", REF)).toMatchObject({ ok: true, normalized: "123456" });
  });

  test("rejections", () => {
    expect(check(ID, "00000000", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(ID, "1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
