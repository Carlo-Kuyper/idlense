import { describe, expect, test } from "vitest";
import { documents, irdCheckDigit, nhiCheckChar } from "../../src/countries/nz.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("NZ_IRD", () => {
  test("Inland Revenue specification examples", () => {
    expect(v("NZ_IRD", "49-091-850")).toMatchObject({ ok: true, formatted: "49-091-850" }); // ex. 1
    expect(v("NZ_IRD", "35901981").ok).toBe(true); // ex. 2
    expect(v("NZ_IRD", "49098576").ok).toBe(true); // ex. 3, secondary weights
    expect(v("NZ_IRD", "136410132")).toMatchObject({ ok: true, formatted: "136-410-132" }); // ex. 4
    expect(v("NZ_IRD", "136410133")).toMatchObject({ ok: false, reason: "invalid_checksum" }); // ex. 5
    expect(v("NZ_IRD", "09125568")).toMatchObject({ ok: false, reason: "invalid_range" }); // ex. 6
    expect(v("NZ_IRD", "139-722-922").ok).toBe(true); // OECD sample letter
    expect(v("NZ_IRD", "200000001")).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("no check digit when both passes give 10", () => {
    let found = 0;
    for (let n = 10000000; n < 10002000 && !found; n++) if (irdCheckDigit(String(n)) === undefined) found = n;
    expect(found).toBeGreaterThan(0);
  });

  test("agrees with idnumbers except the issued-range check", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NZ_IRD"),
      generate: (r) => fromTemplate(r() < 0.5 ? "########" : "[0-3]########", r),
      samples: 6000,
      allow: (s, ours) => (!ours && v("NZ_IRD", s).reason === "invalid_range" ? "outside 10,000,000-200,000,000" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("NZ_NHI", () => {
  test("old format (check digit)", () => {
    expect(v("NZ_NHI", "zac5361")).toMatchObject({ ok: true, normalized: "ZAC5361", data: { extra: { format: "old", test: true } } });
    expect(v("NZ_NHI", "ZAA0105").ok).toBe(true);
    expect(v("NZ_NHI", "WLD9413")).toMatchObject({ ok: true, data: { extra: { test: false } } });
    expect(v("NZ_NHI", "JBX3656").ok).toBe(true);
    expect(v("NZ_NHI", "ZZZ0044")).toMatchObject({ ok: false, reason: "invalid_checksum" }); // remainder 0
  });

  test("new format (check letter, mod 23)", () => {
    expect(v("NZ_NHI", "ZBN77VL")).toMatchObject({ ok: true, data: { extra: { format: "new", test: true } } });
    expect(v("NZ_NHI", "ZVB97XQ").ok).toBe(true);
    expect(v("NZ_NHI", "ZSC21TN").ok).toBe(true);
    expect(v("NZ_NHI", "ZZZ00AA")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(nhiCheckChar("ZBN77V")).toBe("L");
  });

  test("I and O are not used", () => {
    expect(v("NZ_NHI", "IAC5361")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("NZ_NHI", "ZBN77OL")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("NZ_NZBN", () => {
  test("GS1 check digit", () => {
    expect(v("NZ_NZBN", "9429041000014").ok).toBe(true);
    expect(v("NZ_NZBN", "9429041000015")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("NZ_NZBN", "9329041000014")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("NZ_DL", () => {
  test("shape", () => {
    expect(v("NZ_DL", "ab123456")).toMatchObject({ ok: true, normalized: "AB123456" });
    expect(v("NZ_DL", "A1123456")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers except the repeated-digit heuristic", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NZ_DL"),
      generate: (r) => fromTemplate(["AA######", "A#######", "AA111111", "AAA#####"][Math.floor(r() * 4)]!, r),
      allow: (s, ours) => {
        if (ours && /(\d)\1{5}$/.test(s)) return "repeated trailing digits not rejected";
        if (!ours && /^[A-Z][0-9_]\d{6}$/.test(s)) return "first two characters must be letters (upstream \\w allows digits)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
