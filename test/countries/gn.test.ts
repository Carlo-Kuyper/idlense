import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/gn.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIFP = spec(documents, "GN_NIFP");
describeContract(documents);

describe("GN_NIFP", () => {
  // Published samples: 693770885 (valid) and 693770880 (invalid), python-stdnum docs.
  test("published samples", () => {
    expect(check(NIFP, "693-770-885", REF)).toMatchObject({
      ok: true,
      normalized: "693770885",
      formatted: "693-770-885",
      data: { serial: "69377088" },
    });
    expect(check(NIFP, "693770880", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("synthetic Luhn-valid number", () => {
    expect(check(NIFP, "123456782", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(NIFP, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(NIFP, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIFP, "1234567820", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
