import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/nr.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TIN = spec(documents, "NR_TIN");

describe("NR_TIN", () => {
  // "123-456-789" is the placeholder in the Nauru Revenue Office's OECD TIN sheet.
  test("published placeholder", () => {
    expect(check(TIN, "123-456-789")).toMatchObject({ ok: true, normalized: "123456789", formatted: "123-456-789" });
  });

  test("rejections", () => {
    expect(check(TIN, "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(TIN, "1234567890")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
