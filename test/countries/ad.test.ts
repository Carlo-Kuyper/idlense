import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ad.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NRT = spec(documents, "AD_NRT");
describeContract(documents);

describe("AD_NRT", () => {
  // The OECD sheet's own placeholder layouts: F-123456-Z, E-123456-Z, A-123456-Z, ...
  test("resident individual", () => {
    expect(check(NRT, "f-123456-z", REF)).toMatchObject({
      ok: true,
      normalized: "F123456Z",
      formatted: "F-123456-Z",
      data: { citizenship: "resident", serial: "123456", extra: { holderType: "resident_individual", controlLetter: "Z" } },
    });
  });

  test("entities and non-residents", () => {
    expect(check(NRT, "A-712345-B", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "societat_anonima" } } });
    expect(check(NRT, "L-799999-B", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "societat_limitada" } } });
    expect(check(NRT, "E-012345-Q", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "non_resident" } } });
    expect(check(NRT, "U-000001-A", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "parapublic_entity" } } });
  });

  test("invalid_range: outside the documented range for the prefix", () => {
    expect(check(NRT, "F-700000-Z", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(NRT, "A-123456-Z", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(NRT, "L-800000-Z", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("invalid_format and invalid_length", () => {
    expect(check(NRT, "X-123456-Z", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NRT, "F-123456-1", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NRT, "F-12345-Z", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
