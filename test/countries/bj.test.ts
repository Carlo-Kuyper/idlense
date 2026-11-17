import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bj.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const IFU = spec(documents, "BJ_IFU");
describeContract(documents);

describe("BJ_IFU", () => {
  // Published sample: 3200901353510, org-id.guide's example (a company registered in 2009).
  test("published sample", () => {
    expect(check(IFU, "3200901353510", REF)).toMatchObject({
      ok: true,
      data: { serial: "013535", extra: { taxpayerType: "company", registrationYear: 2009, establishment: "parent" } },
    });
  });

  // DGI illustration (seen only as a search excerpt): parent 3200800000314 and its
  // establishments 3200800000324 and 3200800000334.
  test("DGI parent and establishments", () => {
    expect(check(IFU, "3200800000314", REF)).toMatchObject({ ok: true, data: { extra: { establishment: "parent" } } });
    expect(check(IFU, "3200800000324", REF)).toMatchObject({ ok: true, data: { extra: { establishment: "branch" } } });
    expect(check(IFU, "3200800000334", REF)).toMatchObject({ ok: true, data: { extra: { establishment: "branch" } } });
  });

  test("individuals carry sex", () => {
    expect(check(IFU, "1201500012305", REF)).toMatchObject({ ok: true, data: { gender: "male", extra: { taxpayerType: "individual", establishment: "other" } } });
    expect(check(IFU, "2201500012305", REF)).toMatchObject({ ok: true, data: { gender: "female" } });
    const r = check(IFU, "6201500012305", REF);
    expect(r).toMatchObject({ ok: true, data: { extra: { taxpayerType: "ngo" } } });
    expect(r.ok && r.data.gender).toBeFalsy();
  });

  test("rejections", () => {
    expect(check(IFU, "3202700000314", REF)).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(IFU, "7200800000314", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IFU, "3180800000314", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(IFU, "320080000031", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
