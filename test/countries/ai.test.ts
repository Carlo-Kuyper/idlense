import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ai.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "AI_TIN");
describeContract(documents);

describe("AI_TIN", () => {
  test("10 digits", () => {
    expect(check(TIN, "12345 67890", REF)).toMatchObject({ ok: true, normalized: "1234567890", data: { serial: "1234567890", extra: { kind: "individual" } } });
    expect(check(TIN, "2345678901", REF)).toMatchObject({ ok: true, data: { extra: { kind: "business" } } });
  });

  test("rejections", () => {
    expect(check(TIN, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "12345678901", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "3234567890", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "0234567890", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});
