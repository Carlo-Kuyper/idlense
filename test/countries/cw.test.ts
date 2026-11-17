import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/cw.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CRIB = spec(documents, "CW_CRIB");
describeContract(documents);

describe("CW_CRIB", () => {
  test("9 digits, separators ignored", () => {
    expect(check(CRIB, "123 456 789", REF)).toMatchObject({ ok: true, normalized: "123456789", data: { serial: "123456789" } });
  });

  test("rejections", () => {
    expect(check(CRIB, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(CRIB, "1234567890", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
