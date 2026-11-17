import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/sr.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const ID = spec(documents, "SR_ID");
const FIN = spec(documents, "SR_FIN");
describeContract(documents);

describe("SR_ID", () => {
  test("two letters + six digits (Id-kaartenwet 2018)", () => {
    expect(check(ID, "fa 123456", REF)).toMatchObject({
      ok: true,
      normalized: "FA123456",
      data: { serial: "123456", extra: { prefix: "FA" } },
    });
  });

  test("rejections", () => {
    expect(check(ID, "F1234567", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ID, "FA12345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SR_FIN", () => {
  test("8 digits (S.B. 2020 no. 17) or 10 digits (S.B. 2024 no. 74)", () => {
    expect(check(FIN, "12345678", REF)).toMatchObject({ ok: true });
    expect(check(FIN, "1234567890", REF)).toMatchObject({ ok: true });
    // 10-digit FIN printed on Assuria Schadeverzekering N.V.'s published VAT certificate
    expect(check(FIN, "2000002293", REF)).toMatchObject({ ok: true, normalized: "2000002293" });
  });

  test("rejections", () => {
    expect(check(FIN, "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
