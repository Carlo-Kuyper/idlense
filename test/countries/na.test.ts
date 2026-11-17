import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/na.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NA = spec(documents, "NA_ID");
describeContract(documents);

// No official specimen is published. The layout was checked against ~1,000 deceased-estate notices
// in the Government Gazette (e.g. https://www.lac.org.na/laws/2014/5627.pdf), which list each
// person's date of birth next to their identity number. Those are real people's numbers, so they
// aren't copied here; every number below is synthetic.
describe("NA_ID", () => {
  test("birth date and serial", () => {
    expect(check(NA, "85042300123", REF)).toMatchObject({
      ok: true,
      formatted: "850423 00123",
      data: { dateOfBirth: "1985-04-23", birthYear: 1985, serial: "00123" },
    });
    expect(check(NA, "850423 00123", REF)).toMatchObject({ ok: true, normalized: "85042300123" });
  });

  test("century is the latest one that gives a past date", () => {
    expect(check(NA, "05061400017", REF)).toMatchObject({ ok: true, data: { birthYear: 2005 } });
    expect(check(NA, "27111900456", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1927-11-19" } });
    // 17 Nov 2026 is after REF (16 Nov 2026), so it falls back to 1926
    expect(check(NA, "26111700010", REF)).toMatchObject({ ok: true, data: { birthYear: 1926 } });
  });

  test("no sex or check digit is claimed", () => {
    const r = check(NA, "85042300123", REF);
    expect(r.ok && r.data.gender).toBeFalsy();
    expect(check(NA, "85042300124", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(NA, "85022900123", REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 29 Feb 1985
    expect(check(NA, "85133100123", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(NA, "85043200123", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // day 32
    expect(check(NA, "8504230012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(NA, "8504230012345", REF)).toMatchObject({ ok: false, reason: "invalid_length" }); // old 13-digit SWA ID
  });
});
