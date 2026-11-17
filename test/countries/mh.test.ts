import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/mh.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const SSN = spec(documents, "MH_SSN");
const EIN = spec(documents, "MH_EIN");

// Both examples (04-086123 and 08612-04) are the specimens in the RMI's OECD TIN sheet.
describe("MH_SSN", () => {
  test("published specimen", () => {
    expect(check(SSN, "04-086123")).toMatchObject({ ok: true, normalized: "04086123", formatted: "04-086123", data: { serial: "086123" } });
  });

  test("rejections", () => {
    expect(check(SSN, "03-086123")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(SSN, "04-08612")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("MH_EIN", () => {
  test("published specimen", () => {
    expect(check(EIN, "08612-04")).toMatchObject({ ok: true, normalized: "0861204", formatted: "08612-04", data: { serial: "08612" } });
  });

  test("rejections", () => {
    expect(check(EIN, "08612-03")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(EIN, "0861-04")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
