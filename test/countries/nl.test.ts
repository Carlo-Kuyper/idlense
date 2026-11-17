import { describe, expect, test } from "vitest";
import { mod97 } from "../../src/core/algorithms.js";
import { documents, elevenProof } from "../../src/countries/nl.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("NL_BSN", () => {
  test("valid / invalid", () => {
    expect(v("NL_BSN", "1112.22.333")).toMatchObject({ ok: true, formatted: "1112.22.333" });
    expect(v("NL_BSN", "11222333")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(elevenProof("012345672")).toBe(true);
    expect(v("NL_BSN", "12345672")).toMatchObject({ ok: true, normalized: "012345672" });
    expect(v("NL_BSN", "111222334")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("NL_BSN", "000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  const gen = (r: () => number) => fromTemplate("#########", r);
  test("agrees with idnumbers", () => {
    const res = compareWithOracle({ spec: spec(documents, "NL_BSN"), generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "NL_BSN"), generate: gen, samples: 5000 });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("NL_BTW", () => {
  test("both schemes", () => {
    expect(v("NL_BTW", "NL 111222333 B01")).toMatchObject({ ok: true, data: { extra: { scheme: "eleven_proof" } } });
    expect(v("NL_BTW", "123456789B13")).toMatchObject({ ok: true, normalized: "NL123456789B13", data: { extra: { scheme: "mod97" } } });
    expect(v("NL_BTW", "NL123456789B14")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("NL_BTW", "NL111222333B00")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with nationid except the MOD 97-10 scope", () => {
    const res = compareWithOracle({
      spec: spec(documents, "NL_BTW"),
      generate: (r) => fromTemplate("NL#########B[0-2]#", r),
      samples: 20000,
      allow: (s) => {
        const core = s.slice(2, 11);
        if (elevenProof(core)) return undefined;
        if (mod97(s) === 1 || mod97(core) === 1) return "MOD 97-10 over the full NL…B.. string";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
