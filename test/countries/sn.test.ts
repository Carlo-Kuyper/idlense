import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/sn.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CNI = spec(documents, "SN_CNI");
const NIN = spec(documents, "SN_NIN");
const NINEA = spec(documents, "SN_NINEA");
describeContract(documents);

describe("SN_CNI", () => {
  test("extracts sex, region, birth date and serial", () => {
    expect(check(CNI, "1 01 19900101 12345 6", REF)).toMatchObject({
      ok: true,
      normalized: "10119900101123456",
      formatted: "1 01 19900101 12345 6",
      data: { gender: "male", region: "01", dateOfBirth: "1990-01-01", birthYear: 1990, serial: "12345", extra: { checkDigit: "6" } },
    });
    expect(check(CNI, "20520040229000011", REF)).toMatchObject({ ok: true, data: { gender: "female", dateOfBirth: "2004-02-29" } });
  });

  test("rejections", () => {
    expect(check(CNI, "20520030229000011", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(CNI, "10120301231000011", REF)).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(CNI, "30119900101123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CNI, "10119901301123456", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CNI, "1011990010112345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SN_NIN", () => {
  // Published samples: "1 G01 1985 00654" and "2 B01 2010 02565", illustrative numbers in the
  // 2012 press release on the alphanumeric NIN (osiris.sn).
  test("published samples", () => {
    expect(check(NIN, "1 G01 1985 00654", REF)).toMatchObject({
      ok: true,
      normalized: "1G01198500654",
      formatted: "1 G01 1985 00654",
      data: { gender: "male", region: "G01", serial: "00654", extra: { registrationYear: 1985 } },
    });
    expect(check(NIN, "2 B01 2010 02565", REF)).toMatchObject({ ok: true, data: { gender: "female", region: "B01", extra: { registrationYear: 2010 } } });
  });

  test("numeric centre code (before 2012)", () => {
    expect(check(NIN, "1012198500654", REF)).toMatchObject({ ok: true, data: { region: "012" } });
  });

  test("rejections", () => {
    expect(check(NIN, "1G01202700654", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(NIN, "3G01198500654", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIN, "1GG1198500654", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIN, "1G0119850065", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SN_NINEA", () => {
  // Published samples: "3067221 2G2" (python-stdnum docs), "0001122 2G3" (nkac-audit's
  // illustration) and 010079649 (a Dakar company in JO 7892 of 12 March 2026).
  test("published samples", () => {
    expect(check(NINEA, "3067221 2G2", REF)).toMatchObject({
      ok: true,
      normalized: "30672212G2",
      formatted: "3067221 2G2",
      data: { serial: "3067221", extra: { cofi: "2G2", taxRegime: "vat_liable", taxCentre: "G", legalForm: "2" } },
    });
    expect(check(NINEA, "0001122 2G3", REF)).toMatchObject({ ok: true, data: { serial: "0001122" } });
    expect(check(NINEA, "010079649", REF)).toMatchObject({ ok: true, data: { serial: "010079649", extra: {} } });
  });

  test("rejections", () => {
    expect(check(NINEA, "30672213G2", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NINEA, "30672212GG", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NINEA, "30672212", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
