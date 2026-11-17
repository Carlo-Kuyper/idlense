import { describe, expect, test } from "vitest";
import { documents, normalizeRd } from "../../src/countries/mn.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const RD = spec(documents, "MN_RD");
const ENTITY = spec(documents, "MN_ENTITY");

describe("MN_RD", () => {
  test("born before 2000", () => {
    expect(check(RD, "АБ90010112")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1990-01-01", birthYear: 1990, gender: "male", region: "АБ", extra: { checkDigit: "2" } },
    });
  });

  test("born 2000 or later: month + 20", () => {
    expect(check(RD, "УП05321524")).toMatchObject({ ok: true, data: { dateOfBirth: "2005-12-15", gender: "female" } });
    expect(check(RD, "ӨҮ04222937")).toMatchObject({ ok: true, data: { dateOfBirth: "2004-02-29", gender: "male" } });
  });

  test("lowercase Cyrillic is uppercased", () => {
    expect(normalizeRd("аб 90-01-01-12")).toBe("АБ90010112");
    expect(normalizeRd("өү04222937")).toBe("ӨҮ04222937");
    expect(check(RD, "уб 90010112")).toMatchObject({ ok: true, normalized: "УБ90010112" });
  });

  test("rejections", () => {
    expect(check(RD, "AB90010112")).toMatchObject({ ok: false, reason: "invalid_format" }); // Latin look-alikes
    expect(check(RD, "АБ90130112")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(RD, "АБ90200112")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 20
    expect(check(RD, "АБ01023012")).toMatchObject({ ok: false, reason: "invalid_date" }); // 30 Feb 1901
    expect(check(RD, "АБ30210112")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030: future
    expect(check(RD, "АБ9001011")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("MN_ENTITY", () => {
  // 2071096: the Mongolian Stock Exchange's register number, as cited by commercial guides.
  test("published sample", () => {
    expect(check(ENTITY, "2071096").ok).toBe(true);
  });

  test("rejections", () => {
    expect(check(ENTITY, "207109")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
