import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/fi.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

const CHARS = "0123456789ABCDEFHJKLMNPRSTUVWXY";
/** DDMMYY + sign + NNN → full HETU. */
const hetu = (date: string, sign: string, n: string) => `${date}${sign}${n}${CHARS[Number(date + n) % 31]}`;

describe("FI_HETU", () => {
  test("DVV example 131052-308T", () => {
    expect(v("FI_HETU", "131052-308T")).toMatchObject({
      ok: true,
      formatted: "131052-308T",
      data: { dateOfBirth: "1952-10-13", birthYear: 1952, gender: "female", serial: "308", extra: { centurySign: "-" } },
    });
    expect(v("FI_HETU", "131052-308t")).toMatchObject({ ok: true });
  });

  test("every century sign", () => {
    for (const s of "-YXWVU") expect(v("FI_HETU", hetu("010150", s, "123")), s).toMatchObject({ data: { dateOfBirth: "1950-01-01" } });
    for (const s of "ABCDEF") expect(v("FI_HETU", hetu("010110", s, "123")), s).toMatchObject({ data: { dateOfBirth: "2010-01-01" } });
    expect(v("FI_HETU", hetu("010180", "+", "123"))).toMatchObject({ data: { dateOfBirth: "1880-01-01", gender: "male" } });
    expect(v("FI_HETU", hetu("010150", "G", "123"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("rejections", () => {
    expect(v("FI_HETU", "131052A308T")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2052
    expect(v("FI_HETU", hetu("300250", "-", "123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("FI_HETU", hetu("010150", "-", "001"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("FI_HETU", hetu("010150", "-", "900"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("FI_HETU", "131052-308U")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("FI_HETU", "131052308T")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("FI_YTUNNUS and FI_VAT", () => {
  test("valid and invalid", () => {
    expect(v("FI_YTUNNUS", "0112038-9")).toMatchObject({ ok: true, formatted: "0112038-9" });
    expect(v("FI_YTUNNUS", "0112038-8")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("FI_VAT", "FI 0112 0389")).toMatchObject({ ok: true, normalized: "FI01120389" });
    expect(v("FI_VAT", "FI01120388")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});

describe("upstream comparison", () => {
  const gen = (r: () => number) =>
    hetu(fromTemplate("[0-3]#[01]###", r), fromTemplate("[-+A-FU-Y]", r), fromTemplate("###", r)).slice(0, r() < 0.2 ? 10 : 11) +
    "";
  // A fifth of the samples get a random check character so checksum failures are compared too.
  const generate = (r: () => number) => {
    const s = gen(r);
    return s.length === 11 ? s : s + fromTemplate("[0-9A-Y]", r);
  };
  const fix = (more: (s: string) => boolean) => (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v("FI_HETU", s);
    if (r.ok) return undefined;
    if (r.reason === "invalid_date") return "impossible or future birth date rejected";
    if (r.reason === "invalid_range" && more(s)) return "individual number outside 002-899";
    return undefined;
  };

  test("idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "FI_HETU"),
      generate,
      samples: 20000,
      allow: fix(() => true),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "FI_HETU"),
      generate,
      samples: 20000,
      allow: fix(() => true),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid FI_YTUNNUS and FI_VAT", () => {
    for (const [code, tpl] of [
      ["FI_YTUNNUS", "########"],
      ["FI_VAT", "FI########"],
    ] as const) {
      const res = compareWithOracle({
        spec: spec(documents, code),
        generate: (r) => fromTemplate(tpl, r),
        samples: 5000,
      });
      expect(res.unexplained, code).toEqual([]);
      expect(res.validSeen, code).toBeGreaterThan(20);
    }
  });
});
