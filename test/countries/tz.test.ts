import { describe, expect, test } from "vitest";
import { icaoCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/tz.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TZ = spec(documents, "TZ_NIN");
describeContract(documents);

const withCheck = (body: string) => body + icaoCheckDigit(body);

// The layout and the 7-3-1 check were derived from 12 NINs quoted in TanzLII judgments
// (search "NIDA number" on https://tanzlii.org/); 11 pass. They belong to real people, so they
// aren't copied here; every number below is synthetic.
describe("TZ_NIN", () => {
  test("birth date, area code and serial", () => {
    expect(check(TZ, "19850423-12345-00001-22", REF)).toMatchObject({
      ok: true,
      normalized: "19850423123450000122",
      formatted: "19850423-12345-00001-22",
      data: {
        dateOfBirth: "1985-04-23",
        birthYear: 1985,
        serial: "00001",
        extra: { areaCode: "12345", digit19: "2" },
      },
    });
    expect(check(TZ, "20011201123450000110", REF)).toMatchObject({ ok: true, data: { birthYear: 2001 } });
  });

  test("ICAO 7-3-1 check digit", () => {
    expect(icaoCheckDigit("1990010114122000032")).toBe(2);
    expect(check(TZ, "19900101141220000322", REF).ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(TZ, "19850423123450000123", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(TZ, withCheck("1985022912345000012"), REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(TZ, withCheck("2027010112345000012"), REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // future
    expect(check(TZ, withCheck("1985132312345000012"), REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TZ, withCheck("1885042312345000012"), REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TZ, "1985042312345000012", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TZ, "198504231234500001223", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
