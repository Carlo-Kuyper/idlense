import { describe, expect, test } from "vitest";
import { cubaCentury, documents } from "../../src/countries/cu.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CI = spec(documents, "CU_CI");
describeContract(documents);

describe("CU_CI", () => {
  test("extracts date of birth and sex", () => {
    expect(check(CI, "86120501234", REF)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1986-12-05", birthYear: 1986, gender: "female", serial: "12", extra: { centuryDigit: 0 } },
    });
    expect(check(CI, "05031578241", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "2005-03-15", gender: "male" } });
    expect(check(CI, "99123195521", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31" } });
  });

  test("century digit", () => {
    expect(cubaCentury(9)).toBe(1800);
    expect(cubaCentury(0)).toBe(1900);
    expect(cubaCentury(5)).toBe(1900);
    expect(cubaCentury(6)).toBe(2000);
    expect(cubaCentury(8)).toBe(2000);
  });

  test("rejections", () => {
    expect(check(CI, "30010170000", REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030, future
    expect(check(CI, "01022970000", REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 2001-02-29
    expect(check(CI, "86130501234", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CI, "8612050123", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
