import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/lc.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TIN = spec(documents, "LC_TIN");
describeContract(documents);

describe("LC_TIN", () => {
  // OECD sheet (Saint Lucia IRD): up to 6 digits; its sample TIN is 1234.
  test("shape", () => {
    expect(check(TIN, "1234", REF)).toMatchObject({ ok: true });
    expect(check(TIN, "99", REF)).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(TIN, "012345", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "1234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
