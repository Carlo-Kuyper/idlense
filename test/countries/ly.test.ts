import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ly.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const LY = spec(documents, "LY_NN");
describeContract(documents);

describe("LY_NN", () => {
  test("extracts sex, birth year and serial", () => {
    expect(check(LY, "119900012345", REF)).toMatchObject({
      ok: true,
      data: { gender: "male", birthYear: 1990, serial: "001234", extra: { checkDigit: "5" } },
    });
    expect(check(LY, "2 2005 123456 7", REF)).toMatchObject({ ok: true, data: { gender: "female", birthYear: 2005, serial: "123456" } });
  });

  // Published sample: 120020012345, an illustrative placeholder in a public regex gist.
  test("published sample", () => {
    expect(check(LY, "120020012345", REF)).toMatchObject({ ok: true, data: { gender: "male", birthYear: 2002 } });
  });

  test("rejections", () => {
    expect(check(LY, "120270012345", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(LY, "320020012345", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(LY, "118990012345", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(LY, "12002001234", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
