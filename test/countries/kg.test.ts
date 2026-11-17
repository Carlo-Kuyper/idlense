import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/kg.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const PIN = spec(documents, "KG_PIN");

describe("KG_PIN", () => {
  test("citizen: sex, DDMMYYYY, issuer, serial", () => {
    expect(check(PIN, "2 15011990 1 001 5")).toMatchObject({
      ok: true,
      normalized: "21501199010015",
      formatted: "2 15011990 1 001 5",
      data: {
        dateOfBirth: "1990-01-15",
        birthYear: 1990,
        gender: "male",
        citizenship: "citizen",
        serial: "001",
        extra: { issuer: "tax_authority", checkDigit: "5" },
      },
    });
    expect(check(PIN, "12902200450010")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2004-02-29", gender: "female", extra: { issuer: "state_registry" } },
    });
    expect(check(PIN, "13112188000010")).toMatchObject({ ok: true, data: { dateOfBirth: "1880-12-31", extra: { issuer: "social_fund" } } });
  });

  test("foreigner digit", () => {
    const res = check(PIN, "40101198550010");
    expect(res).toMatchObject({ ok: true, data: { citizenship: "foreigner", dateOfBirth: "1985-01-01" } });
    expect(res.ok && res.data.gender).toBeFalsy();
  });

  test("rejections", () => {
    expect(check(PIN, "22902200150010")).toMatchObject({ ok: false, reason: "invalid_date" }); // 29 Feb 2001
    expect(check(PIN, "20101203050010")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030: future
    expect(check(PIN, "50101199050010")).toMatchObject({ ok: false, reason: "invalid_format" }); // sex digit
    expect(check(PIN, "20113199050010")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(PIN, "20101170050010")).toMatchObject({ ok: false, reason: "invalid_format" }); // year 1700
    expect(check(PIN, "2010119905001")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
