import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/om.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const VAT = spec(documents, "OM_VAT");

describe("OM_VAT", () => {
  test("OM + 10 digits", () => {
    expect(check(VAT, "om 1100012345")).toMatchObject({ ok: true, normalized: "OM1100012345", data: { serial: "1100012345" } });
  });

  test("rejections", () => {
    expect(check(VAT, "AE1100012345")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(VAT, "OM110001234X")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(VAT, "OM110001234")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
