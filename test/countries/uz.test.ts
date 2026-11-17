import { describe, expect, test } from "vitest";
import { documents, pinflCheckDigit } from "../../src/countries/uz.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

describeContract(documents);
const PINFL = spec(documents, "UZ_PINFL");
const withCheck = (first13: string) => first13 + pinflCheckDigit(first13);

describe("UZ_PINFL", () => {
  test("worked example from Resolution 177", () => {
    expect(pinflCheckDigit("3121093204024")).toBe(7);
    expect(check(PINFL, "3 121093 204 024 7")).toMatchObject({
      ok: true,
      formatted: "3 121093 204 024 7",
      data: { dateOfBirth: "1993-10-12", birthYear: 1993, gender: "male", region: "204", serial: "024" },
    });
  });

  test("century and sex digit", () => {
    expect(check(PINFL, withCheck("2010185001001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1885-01-01", gender: "female" } });
    expect(check(PINFL, withCheck("5150620010123"))).toMatchObject({ ok: true, data: { dateOfBirth: "2020-06-15", gender: "male" } });
    expect(check(PINFL, withCheck("6290204001001"))).toMatchObject({ ok: true, data: { dateOfBirth: "2004-02-29", gender: "female" } });
    expect(check(PINFL, withCheck("7010180005001"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(check(PINFL, "31210932040246")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(PINFL, withCheck("5010130005001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030: future
    expect(check(PINFL, withCheck("3290201005001"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 29 Feb 1901
    expect(check(PINFL, withCheck("3011380005001"))).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(PINFL, "3121093204024")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
