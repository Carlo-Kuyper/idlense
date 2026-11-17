import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/cm.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const NIU = spec(documents, "CM_NIU");
describeContract(documents);

describe("CM_NIU", () => {
  // Published samples: M099600009248R (org-id.guide example) and M030100012255Y (SOCATUR's
  // company letterhead, codatu.org presentation).
  test("published samples", () => {
    expect(check(NIU, "M099600009248R", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "entity", checkLetter: "R" } } });
    expect(check(NIU, "m030100012255y", REF)).toMatchObject({ ok: true, normalized: "M030100012255Y" });
  });

  test("individual prefix", () => {
    expect(check(NIU, "P000000000001A", REF)).toMatchObject({ ok: true, data: { extra: { taxpayerType: "individual" } } });
  });

  test("rejections", () => {
    expect(check(NIU, "X099600009248R", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIU, "M0996000092481", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIU, "M09960000924R", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
