import { describe, expect, test } from "vitest";
import { documents, normalizeForeignCompany, sgCheckLetter } from "../../src/countries/sg.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const NRIC = spec(documents, "SG_NRIC");
const FIN = spec(documents, "SG_FIN");
const UEN = spec(documents, "SG_UEN");
describeContract(documents);

const withCheck = (first8: string) => first8 + sgCheckLetter(first8 + "?");

describe("SG_NRIC / SG_FIN", () => {
  test("extracts series and serial", () => {
    expect(check(NRIC, "s1234567d")).toMatchObject({
      ok: true,
      normalized: "S1234567D",
      data: { serial: "1234567", extra: { series: "S" } },
    });
    expect(check(NRIC, withCheck("T0123456"))).toMatchObject({ ok: true, data: { extra: { series: "T" } } });
    expect(check(FIN, "M5012345J")).toMatchObject({
      ok: true,
      data: { citizenship: "foreigner", serial: "5012345", extra: { series: "M" } },
    });
    expect(check(FIN, withCheck("F1234567"))).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(check(FIN, withCheck("G1234567"))).toMatchObject({ ok: true });
  });

  test("rejections", () => {
    expect(check(NRIC, "S1234567A")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(NRIC, "F1234567N")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(FIN, "S1234567D")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(FIN, "M5012345M")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(NRIC, "S123456D")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const gen = (prefixes: string) => (r: () => number) =>
    r() < 0.5 ? withCheck(fromTemplate(`[${prefixes}]#######`, r)) : fromTemplate(`[${prefixes}]#######A`, r);

  test("agrees with nationid", () => {
    for (const [s, code, p] of [[NRIC, "SG_NRIC", "ST"], [FIN, "SG_FIN", "FGM"]] as const) {
      const res = compareWithOracle({ spec: s, generate: gen(p), samples: 5000 });
      expect(res.unexplained, code).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    }
  });

  test("agrees with idnumbers except the M-series offset fix", () => {
    for (const [s, p] of [[NRIC, "ST"], [FIN, "FGM"]] as const) {
      const res = compareWithOracle({
        spec: s,
        generate: gen(p),
        samples: 5000,
        allow: (x) => (x[0] === "M" ? "M-series check uses the +3 offset" : undefined),
      });
      expect(res.unexplained).toEqual([]);
      expect(res.validSeen).toBeGreaterThan(20);
    }
  });
});

describe("SG_UEN", () => {
  test("categories", () => {
    expect(check(UEN, "197401143C")).toMatchObject({
      ok: true,
      data: { serial: "01143", extra: { category: "local_company", registrationYear: 1974 } },
    });
    expect(check(UEN, "196800306E")).toMatchObject({ ok: true }); // DBS Bank
    expect(check(UEN, "199201624D")).toMatchObject({ ok: true }); // Singtel
    expect(check(UEN, "00192200M")).toMatchObject({ ok: true, data: { extra: { category: "business" } } });
    expect(check(UEN, "S16FC0121D")).toMatchObject({
      ok: true,
      data: { serial: "0121", extra: { category: "other", entityType: "FC", registrationYear: 1916 } },
    });
    expect(check(UEN, "T01FC6132D")).toMatchObject({ ok: true, data: { extra: { registrationYear: 2001 } } });
  });

  test("rejections", () => {
    expect(check(UEN, "197401143D")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(UEN, "202701143C")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(UEN, "T99FC6132D")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(UEN, "T01ZZ6132D")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(UEN, "123401143C")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid except documented fixes", () => {
    const types = ["FC", "LP", "SS", "CC", "ZZ"];
    const res = compareWithOracle({
      spec: UEN,
      generate: (r) => {
        const k = r();
        if (k < 0.33) return fromTemplate("########A", r);
        if (k < 0.66) return fromTemplate("[12][089]#######A", r);
        return fromTemplate("[RST]##", r) + types[Math.floor(r() * types.length)] + fromTemplate("####X", r);
      },
      samples: 60000,
      allow: (x, ours) => {
        if (ours) return undefined;
        const res = check(UEN, x);
        if (res.ok) return undefined;
        if (/^\d{9}[A-Z]$/.test(x) && !/^(18|19|20)/.test(x) && res.reason === "invalid_format") return "ROC year before 1800";
        if (/^T/.test(x) && res.reason === "invalid_range") return "future registration year";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("SG_ASGD", () => {
  const ASGD = spec(documents, "SG_ASGD");
  test("extracts the serial", () => {
    expect(check(ASGD, "a1234567b")).toMatchObject({
      ok: true,
      normalized: "A1234567B",
      data: { serial: "1234567", extra: { checkLetter: "B" } },
    });
  });
  test("rejections", () => {
    expect(check(ASGD, "S1234567D")).toMatchObject({ ok: false, reason: "invalid_format" }); // NRIC
    expect(check(ASGD, "A12345678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ASGD, "A123456B")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SG_FOREIGN_COMPANY", () => {
  const FC = spec(documents, "SG_FOREIGN_COMPANY");
  test("F000NNNNNC and the spaced FDDDNNNNNC form", () => {
    expect(check(FC, "F00012345C")).toMatchObject({ ok: true, data: { serial: "12345", extra: { checkLetter: "C" } } });
    expect(normalizeForeignCompany("F   12345C")).toBe("F00012345C");
    expect(check(FC, "F   12345C")).toMatchObject({ ok: true, normalized: "F00012345C" });
  });
  test("rejections", () => {
    expect(check(FC, "F12312345C")).toMatchObject({ ok: false, reason: "invalid_format" }); // only 000 or spaces
    expect(check(FC, "F000123456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(FC, "F0001234C")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(FC, "F1234567N")).toMatchObject({ ok: false, reason: "invalid_length" }); // a FIN
  });
});
