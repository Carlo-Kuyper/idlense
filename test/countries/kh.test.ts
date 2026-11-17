import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/kh.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const TIN = spec(documents, "KH_TIN");

describe("KH_TIN", () => {
  test("prefixed and bare forms", () => {
    expect(check(TIN, "k001-901234567")).toMatchObject({
      ok: true,
      normalized: "K001901234567",
      formatted: "K001-901234567",
      data: { serial: "901234567", extra: { prefix: "K001" } },
    });
    expect(check(TIN, "901234567")).toMatchObject({ ok: true, data: { serial: "901234567", extra: {} } });
  });

  test("rejections", () => {
    expect(check(TIN, "1001-901234567")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "KA01-901234567")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(TIN, "K001-90123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
