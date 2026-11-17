import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ck.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const RMD = spec(documents, "CK_RMD");
describeContract(documents);

describe("CK_RMD", () => {
  test("5 digits", () => {
    expect(check(RMD, "01234", REF)).toMatchObject({ ok: true, data: { serial: "01234" } });
  });

  test("rejections", () => {
    expect(check(RMD, "1234", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(RMD, "123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
