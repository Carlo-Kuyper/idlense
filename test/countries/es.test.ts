import { describe, expect, test } from "vitest";
import { cifControl, dniLetter, documents, nussChecks } from "../../src/countries/es.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const randLetter = (r: () => number) => LETTERS[Math.floor(r() * 23)]!;

describe("ES_DNI", () => {
  test("valid", () => {
    expect(v("ES_DNI", "12345678-z")).toMatchObject({
      ok: true,
      normalized: "12345678Z",
      data: { citizenship: "citizen", serial: "12345678" },
    });
    expect(v("ES_DNI", "12345678A")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("ES_DNI", "12345678I")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("ES_DNI", "00000000T")).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  const gen = (r: () => number) => {
    const d = r() < 0.03 ? "00000000" : fromTemplate("########", r);
    return d + (r() < 0.6 ? dniLetter(d) : randLetter(r));
  };
  const allow = (s: string, ours: boolean) => (!ours && s.startsWith("00000000") ? "all-zero DNI rejected" : undefined);

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "ES_DNI"), generate: gen, allow });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "ES_DNI"), generate: gen, allow });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("ES_NIE", () => {
  test("valid", () => {
    expect(v("ES_NIE", "X-1234567-L")).toMatchObject({
      ok: true,
      normalized: "X1234567L",
      data: { citizenship: "foreigner", serial: "1234567", extra: { prefix: "X" } },
    });
    expect(v("ES_NIE", "Y1234567" + dniLetter("11234567"))).toMatchObject({ ok: true, data: { extra: { prefix: "Y" } } });
    expect(v("ES_NIE", "Z1234567" + dniLetter("21234567"))).toMatchObject({ ok: true });
    expect(v("ES_NIE", "X1234567M")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("ES_NIE", "W1234567L")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "ES_NIE"),
      generate: (r) => {
        const p = "XYZ"[Math.floor(r() * 3)]!;
        const d = fromTemplate("#######", r);
        return p + d + (r() < 0.6 ? dniLetter(String("XYZ".indexOf(p)) + d) : randLetter(r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("ES_NIF_KLM", () => {
  test("kinds", () => {
    expect(v("ES_NIF_KLM", "K1234567L")).toMatchObject({ ok: true, data: { citizenship: "citizen", extra: { kind: "spanish_under_14" } } });
    expect(v("ES_NIF_KLM", "L1234567L")).toMatchObject({ ok: true, data: { extra: { kind: "spanish_non_resident" } } });
    expect(v("ES_NIF_KLM", "M1234567L")).toMatchObject({ ok: true, data: { citizenship: "foreigner", extra: { kind: "foreigner_without_nie" } } });
    expect(v("ES_NIF_KLM", "M1234567T")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});

describe("ES_NIF_PJ", () => {
  test("valid", () => {
    expect(v("ES_NIF_PJ", "A-58818501")).toMatchObject({ ok: true, data: { region: "58", serial: "81850", extra: { entityType: "A" } } });
    expect(v("ES_NIF_PJ", "ESA58818501")).toMatchObject({ ok: true, normalized: "A58818501" });
    expect(v("ES_NIF_PJ", "A5881850A")).toMatchObject({ ok: false, reason: "invalid_checksum" }); // A needs a digit
    expect(v("ES_NIF_PJ", "Q2826000H")).toMatchObject({ ok: true }); // letter control: r=8 → H
    expect(v("ES_NIF_PJ", "Q28260008")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("ES_NIF_PJ", "G2826000H")).toMatchObject({ ok: true });
    expect(v("ES_NIF_PJ", "G28260008")).toMatchObject({ ok: true });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "ES_NIF_PJ"),
      generate: (r) => {
        const t = "ABCDEFGHJNPQRSUVW"[Math.floor(r() * 17)]!;
        const d = fromTemplate("#######", r);
        const c = cifControl(d);
        const tail = r() < 0.35 ? String(c) : r() < 0.5 ? "JABCDEFGHI"[c]! : fromTemplate("[0-9A-J]", r);
        return t + d + tail;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("ES_NUSS", () => {
  test("valid", () => {
    expect(v("ES_NUSS", "28/12345678/40")).toMatchObject({
      ok: true,
      formatted: "28/12345678/40",
      data: { region: "28", serial: "12345678" },
    });
    expect(v("ES_NUSS", "281234567841")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("short sequence: both TGSS forms accepted", () => {
    const [concat, short] = nussChecks("2801234567");
    expect(concat).toBe(Number(2801234567n % 97n));
    expect(short).toBe((28 * 10_000_000 + 1234567) % 97);
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(v("ES_NUSS", "2801234567" + pad(concat!))).toMatchObject({ ok: true });
    expect(v("ES_NUSS", "2801234567" + pad(short!))).toMatchObject({ ok: true });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "ES_NUSS"),
      generate: (r) => {
        const b = fromTemplate(r() < 0.3 ? "[0-5]#0#######" : "[0-5]#########", r);
        const checks = nussChecks(b);
        const c = r() < 0.7 ? checks[Math.floor(r() * checks.length)]! : Math.floor(r() * 100);
        return b + String(c).padStart(2, "0");
      },
      allow: (s, ours) =>
        ours && Number(s.slice(2, 10)) < 10_000_000 && nussChecks(s.slice(0, 10))[1] === Number(s.slice(10))
          ? "TGSS short form for sequences below 10 000 000"
          : undefined,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
