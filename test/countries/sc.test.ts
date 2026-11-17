import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/sc.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "SC_TIN");
describeContract(documents);

describe("SC_TIN", () => {
  // Seychelles Breweries Ltd in the SRC public register, via https://lookuptax.com/validate/seychelles/tin
  test("published sample", () => {
    expect(check(TIN, "961900106", REF)).toMatchObject({ ok: true, formatted: "961 900 106" });
    expect(check(TIN, "961 900 106", REF).ok).toBe(true);
  });

  // OECD sheet: any "person" liable for revenue, individuals in business included
  test("issued to individuals and entities", () => {
    expect(TIN.holder).toBe("both");
  });

  test("rejections", () => {
    expect(check(TIN, "96190010", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "C841033", REF)).toMatchObject({ ok: false, reason: "invalid_length" }); // business registration no.
  });
});
