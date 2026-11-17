import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/so.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIN = spec(documents, "SO_NIN");
describeContract(documents);

// No sample is published; numbers are synthetic.
describe("SO_NIN", () => {
  test("11 digits", () => {
    expect(check(NIN, "123 4567 8901", REF)).toMatchObject({ ok: true, normalized: "12345678901" });
  });

  test("rejections", () => {
    expect(check(NIN, "1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NIN, "123456789012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
