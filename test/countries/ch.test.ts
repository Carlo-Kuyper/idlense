import { describe, expect, test } from "vitest";
import { ahvCheckDigit, documents, uidCheckDigit } from "../../src/countries/ch.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const genAhv = (r: () => number) => {
  const b = "756" + fromTemplate("#########", r);
  return b + (r() < 0.6 ? ahvCheckDigit(b) : fromTemplate("#", r));
};
const genUid = (r: () => number) => {
  const b = fromTemplate("########", r);
  return "CHE" + b + (r() < 0.6 ? (uidCheckDigit(b) ?? 0) : fromTemplate("#", r));
};

describe("CH_AHV", () => {
  test("valid", () => {
    expect(v("CH_AHV", "756.9217.0769.85")).toMatchObject({ ok: true, formatted: "756.9217.0769.85", data: { serial: "921707698" } });
    expect(v("CH_AHV", "756.9217.0769.84")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CH_AHV", "757.9217.0769.85")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "CH_AHV"), generate: genAhv });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({ spec: spec(documents, "CH_AHV"), generate: genAhv });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CH_UID / CH_MWST", () => {
  test("valid", () => {
    expect(v("CH_UID", "CHE-109.322.551")).toMatchObject({ ok: true, formatted: "CHE-109.322.551" });
    expect(v("CH_UID", "CHE-109.322.552")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("CH_MWST", "CHE-109.322.551 TVA")).toMatchObject({ ok: true, formatted: "CHE-109.322.551 TVA", data: { extra: { suffix: "TVA" } } });
    expect(v("CH_MWST", "CHE-109.322.551 VAT")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("remainder 1 is never issued", () => {
    const body = ["00000003", "10000000", "00000040"].find((b) => uidCheckDigit(b) === undefined);
    expect(body).toBeDefined();
  });

  test("UID agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "CH_UID"), generate: genUid });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("MWST agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CH_MWST"),
      generate: (r) => genUid(r) + ["MWST", "TVA", "IVA"][Math.floor(r() * 3)],
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("UID: idnumbers checks only the shape", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CH_UID"),
      generate: genUid,
      allow: (s, ours) => {
        const r = v("CH_UID", s);
        return !ours && !r.ok && r.reason === "invalid_checksum" ? "UID check digit verified" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
