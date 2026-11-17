import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/lb.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const ID = spec(documents, "LB_ID");

describe("LB_ID", () => {
  test("12 digits", () => {
    expect(check(ID, "1234 5678 9012")).toMatchObject({ ok: true, normalized: "123456789012", data: { extra: {} } });
  });

  test("rejections", () => {
    expect(check(ID, "12345678901")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(ID, "1234567890123")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
