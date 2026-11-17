import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/am.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

describeContract(documents);

describe("Armenia", () => {
  test("PSN shape", () => {
    expect(check(spec(documents, "AM_PSN"), "12345 67890", REF)).toMatchObject({ ok: true, normalized: "1234567890" });
    expect(check(spec(documents, "AM_PSN"), "123456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("TIN shape", () => {
    expect(check(spec(documents, "AM_TIN"), "1234-5678", REF)).toMatchObject({ ok: true, data: { serial: "1234567" } });
    expect(check(spec(documents, "AM_TIN"), "1234567", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
