import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/et.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const FIN = spec(documents, "ET_FIN");
const TIN = spec(documents, "ET_TIN");
describeContract(documents);

describe("ET_FIN", () => {
  test("12 digits", () => {
    expect(check(FIN, "1234 5678 9012", REF)).toMatchObject({
      ok: true,
      normalized: "123456789012",
      formatted: "1234 5678 9012",
    });
  });

  test("rejections", () => {
    expect(check(FIN, "12345678901", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(FIN, "1234567890123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" }); // 16-digit card number
  });
});

describe("ET_TIN", () => {
  // The Ministry of Revenues' verification example (a company), via https://lookuptax.com/validate/ethiopia/tin
  test("published sample", () => {
    expect(check(TIN, "0012814908", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(TIN, "001281490", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "001281490814", REF)).toMatchObject({ ok: false, reason: "invalid_length" }); // with sub-TIN suffix
  });
});
