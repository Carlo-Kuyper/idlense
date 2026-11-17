import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/az.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

describeContract(documents);

describe("Azerbaijan", () => {
  const FIN = spec(documents, "AZ_FIN");
  const VOEN = spec(documents, "AZ_VOEN");

  test("FİN shape", () => {
    expect(check(FIN, "5vbk5vr", REF)).toMatchObject({ ok: true, normalized: "5VBK5VR" });
    // OECD Azerbaijan TIN sheet examples.
    for (const fin of ["30LJV5Z", "3C15N76"]) expect(check(FIN, fin, REF), fin).toMatchObject({ ok: true, normalized: fin });
    expect(check(FIN, "5VBK5OR", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // never the letter O
    expect(check(FIN, "5VBK5V", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("VÖEN holder type", () => {
    expect(check(VOEN, "1525855852", REF)).toMatchObject({
      ok: true,
      data: { region: "15", serial: "258558", extra: { holderType: "individual" } },
    });
    expect(check(VOEN, "1325678851", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "legal_entity" } } });
    expect(check(VOEN, "1325678853", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});
