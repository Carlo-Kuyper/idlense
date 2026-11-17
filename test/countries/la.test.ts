import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/la.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TIN = spec(documents, "LA_TIN");

describe("LA_TIN", () => {
  test("segments per Decree 354/PM", () => {
    expect(check(TIN, "123456785900")).toMatchObject({
      ok: true,
      data: { serial: "12345678", extra: { controlDigit: "5", vatRegistered: true, branch: "00" } },
    });
    expect(check(TIN, "123456785003")).toMatchObject({ ok: true, data: { extra: { vatRegistered: false, branch: "03" } } });
  });

  test("rejections", () => {
    expect(check(TIN, "123456785500")).toMatchObject({ ok: false, reason: "invalid_format" }); // VAT flag must be 0 or 9
    expect(check(TIN, "12345678590")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("LA_TIN display form", () => {
  test("formats as aaaaaaaab-9cc (Decree 354/PM art. 4) and round-trips", () => {
    expect(check(TIN, "123456785900")).toMatchObject({ ok: true, formatted: "123456785-900" });
    expect(check(TIN, "123456785-003")).toMatchObject({ ok: true, normalized: "123456785003", formatted: "123456785-003" });
  });
});
