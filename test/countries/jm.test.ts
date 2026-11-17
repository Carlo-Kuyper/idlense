import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/jm.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const TRN = spec(documents, "JM_TRN");
describeContract(documents);

describe("JM_TRN", () => {
  test("individual vs organisation", () => {
    expect(check(TRN, "123-456-789", REF)).toMatchObject({
      ok: true,
      formatted: "123-456-789",
      data: { extra: { holderType: "individual" } },
    });
    expect(check(TRN, "012345678", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "organization" } } });
  });

  test("rejections", () => {
    expect(check(TRN, "223456789", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TRN, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
