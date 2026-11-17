import { describe, expect, test } from "vitest";
import { documents, tnMfCheckLetter } from "../../src/countries/tn.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const CIN = spec(documents, "TN_CIN");
const MF = spec(documents, "TN_MF");
describeContract(documents);

describe("TN_CIN", () => {
  test("8 digits", () => {
    expect(check(CIN, "01234567", REF)).toMatchObject({ ok: true, data: { serial: "01234567" } });
  });

  test("rejections", () => {
    expect(check(CIN, "0123456A", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CIN, "0123456", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("TN_MF", () => {
  test("check letter", () => {
    expect(tnMfCheckLetter("1282182")).toBe("W");
    expect(tnMfCheckLetter("1234567")).toBe("R");
  });

  test("full form extracts VAT code, category and establishment", () => {
    expect(check(MF, "1282182/W/A/M/000", REF)).toMatchObject({
      ok: true,
      normalized: "1282182WAM000",
      formatted: "1282182/W/A/M/000",
      data: { serial: "1282182", extra: { checkLetter: "W", vatCode: "A", category: "M", establishment: "000" } },
    });
    expect(check(MF, "1282182/W/A/E/001", REF)).toMatchObject({
      ok: true,
      data: { extra: { category: "E", establishment: "001" } },
    });
    expect(check(MF, "1282182W", REF)).toMatchObject({ ok: true, formatted: "1282182/W", data: { extra: { checkLetter: "W" } } });
  });

  // Published samples: 1282182W, 1496298T, 0000121J (python-stdnum docs); 849034Z/A/M/000
  // (Polymedical SA) and "345 769 JAM 000" (SAHM SA), companies' numbers in JORT announcements
  // 077/2022. stdnum's 1234567/M/A/E/001 is a placeholder whose letter doesn't match (R).
  test("published samples", () => {
    expect(check(MF, "1282182W", REF).ok).toBe(true);
    expect(check(MF, "1496298T", REF).ok).toBe(true);
    expect(check(MF, "0000121J", REF).ok).toBe(true);
    expect(check(MF, "849034Z/A/M/000", REF)).toMatchObject({ ok: true, normalized: "0849034ZAM000" });
    expect(check(MF, "345 769 JAM 000", REF)).toMatchObject({ ok: true, normalized: "0345769JAM000" });
    expect(check(MF, "1234567/M/A/E/001", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("rejections", () => {
    expect(check(MF, "1282182X", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(MF, "1282182I", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MF, "1282182WXM000", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MF, "1282182WAM001", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(MF, "1282182WAM00", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
