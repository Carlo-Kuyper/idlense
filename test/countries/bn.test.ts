import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/bn.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const IC = spec(documents, "BN_IC");
const ROC = spec(documents, "BN_ROC");

describe("BN_IC", () => {
  test("issued from 2000: prefix gives status", () => {
    expect(check(IC, "01-123456")).toMatchObject({
      ok: true,
      normalized: "01123456",
      formatted: "01-123456",
      data: { citizenship: "citizen", serial: "123456", extra: { cardColour: "yellow", issuedBefore2000: false } },
    });
    expect(check(IC, "31-000001")).toMatchObject({ ok: true, data: { citizenship: "permanent_resident", extra: { cardColour: "purple" } } });
    expect(check(IC, "99-000001")).toMatchObject({ ok: true, data: { citizenship: "temporary_resident", extra: { cardColour: "green" } } });
  });

  // Block boundaries from the Revenue Division's OECD TIN sheet.
  test("issued before 2000: serial blocks", () => {
    expect(check(IC, "00-080000")).toMatchObject({ ok: true, data: { citizenship: "citizen", extra: { issuedBefore2000: true } } });
    expect(check(IC, "00-315001")).toMatchObject({ ok: true, data: { citizenship: "citizen" } });
    expect(check(IC, "30-080001")).toMatchObject({ ok: true, data: { citizenship: "permanent_resident" } });
    expect(check(IC, "50-999999")).toMatchObject({ ok: true, data: { citizenship: "temporary_resident" } });
  });

  test("rejections", () => {
    expect(check(IC, "00-080001")).toMatchObject({ ok: false, reason: "invalid_range" }); // PR block under citizen prefix
    expect(check(IC, "30-130001")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(IC, "50-000001")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(IC, "00-000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(IC, "01-12345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("BN_ROC", () => {
  // RC00000567 is MOFE's own conversion example; RC00001114 and RC20001873 appear in a
  // MOFE striking-off notice (14 Aug 2025).
  test("published numbers", () => {
    expect(check(ROC, "RC00000567")).toMatchObject({ ok: true, data: { serial: "00000567", extra: { kind: "company" } } });
    expect(check(ROC, "RC00001114").ok).toBe(true);
    expect(check(ROC, "RC20001873").ok).toBe(true);
  });

  test("prefix kinds", () => {
    expect(check(ROC, "P00012345")).toMatchObject({ ok: true, data: { extra: { kind: "business_name" } } });
    expect(check(ROC, "rfc00012345")).toMatchObject({ ok: true, normalized: "RFC00012345", data: { extra: { kind: "foreign_company_branch" } } });
  });

  test("rejections", () => {
    expect(check(ROC, "RX00000567")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ROC, "RC0000056A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ROC, "RC0000056")).toMatchObject({ ok: false, reason: "invalid_format" }); // 9 chars but not P+8
    expect(check(ROC, "RC000005678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ROC, "RC0000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
