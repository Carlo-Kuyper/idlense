import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ug.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const UG = spec(documents, "UG_NIN");
describeContract(documents);

describe("UG_NIN", () => {
  test("extracts class, gender and birth year", () => {
    expect(check(UG, "CF85000012345A", REF)).toMatchObject({
      ok: true,
      data: { birthYear: 1985, gender: "female", citizenship: "citizen", serial: "000012345A", extra: { applicantClass: "C" } },
    });
    expect(check(UG, "fm0100001234ab", REF)).toMatchObject({
      ok: true,
      normalized: "FM0100001234AB",
      data: { birthYear: 2001, gender: "male", citizenship: "foreigner" },
    });
  });

  test("century: latest year not in the future", () => {
    expect(check(UG, "CM26000012345A", REF)).toMatchObject({ ok: true, data: { birthYear: 2026 } });
    expect(check(UG, "CM27000012345A", REF)).toMatchObject({ ok: true, data: { birthYear: 1927 } });
  });

  test("unmapped applicant class has no citizenship", () => {
    const r = check(UG, "AM90000012345A", REF);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.citizenship).toBeUndefined();
  });

  // Published sample: CM90012345678X (gera-tools validator page). The Dojah API docs'
  // placeholder CM123456789AB is only 13 characters, so it is rejected.
  test("published samples", () => {
    expect(check(UG, "CM90012345678X", REF)).toMatchObject({ ok: true, data: { birthYear: 1990, gender: "male" } });
    expect(check(UG, "CM123456789AB", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("rejections", () => {
    expect(check(UG, "CX85000012345A", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(UG, "CMA5000012345A", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(UG, "CF85000012345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
