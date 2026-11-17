import { describe, expect, test } from "vitest";
import { curpCheckDigit, documents, MX_CURP_STATES, rfcCheckChar } from "../../src/countries/mx.js";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const curp = (body17: string) => body17 + curpCheckDigit(body17);
const rfcPf = (body12: string) => body12 + rfcCheckChar(body12);
const rfcPm = (body11: string) => body11 + rfcCheckChar(" " + body11);

describe("MX_CURP", () => {
  test("extracts everything", () => {
    expect(v("MX_CURP", "gomc 850315 hdf rrr 07")).toMatchObject({
      ok: true,
      normalized: "GOMC850315HDFRRR07",
      data: { dateOfBirth: "1985-03-15", birthYear: 1985, gender: "male", region: "DF", regionName: "Ciudad de México", serial: "0" },
    });
    expect(v("MX_CURP", "XEXX010101HNEXXXA4")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2001-01-01", region: "NE", regionName: "Nacido en el extranjero" },
    });
  });

  test("century from the homoclave, non-binary X, female", () => {
    expect(v("MX_CURP", curp("PEMJ050101MJCRRNA"))).toMatchObject({ ok: true, data: { dateOfBirth: "2005-01-01", gender: "female" } });
    expect(v("MX_CURP", curp("PEMJ050101MJCRRN0"))).toMatchObject({ ok: true, data: { dateOfBirth: "1905-01-01" } });
    const x = v("MX_CURP", curp("PEMJ900101XJCRRN0"));
    expect(x).toMatchObject({ ok: true, data: { extra: { sex: "X" } } });
    expect(x.ok && x.data.gender).toBeUndefined();
  });

  test("rejections", () => {
    expect(v("MX_CURP", "GOMC850315HDFRRR00")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("MX_CURP", curp("PEMJ300101HZZRRN0"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("MX_CURP", curp("PEMJ010229HDFRRN0"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 1901 not leap
    expect(v("MX_CURP", curp("PEMJ301231HDFRRNA"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030: future
    expect(v("MX_CURP", curp("PBMJ800101HDFRRN0"))).toMatchObject({ ok: false, reason: "invalid_format" }); // 2nd must be vowel/X
    expect(v("MX_CURP", curp("PEMJ800101HDFRAN0"))).toMatchObject({ ok: false, reason: "invalid_format" }); // vowel in consonants
    expect(v("MX_CURP", "GOMC850315HDFRRR0")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const states = Object.keys(MX_CURP_STATES);
  const gen = (r: () => number) => {
    const state = r() < 0.9 ? states[Math.floor(r() * states.length)]! : fromTemplate("AA", r);
    const body =
      fromTemplate("A[AEIOUX]AA##[01]#[0-3]#[HMX]", r) +
      state +
      fromTemplate(r() < 0.9 ? "[BCDFGHJKLMNPQRSTVWXYZ][BCDFGHJKLMNPQRSTVWXYZ][BCDFGHJKLMNPQRSTVWXYZ]" : "AAA", r) +
      fromTemplate(r() < 0.5 ? "#" : "A", r);
    const cd = curpCheckDigit(body);
    return body + (r() < 0.85 ? cd : fromTemplate("#", r));
  };
  /** Our fixes: impossible/future dates, RENAPO letter positions, sex X. */
  const allow = (s: string, ours: boolean) => {
    if (ours) return s[10] === "X" ? "non-binary sex X accepted" : undefined;
    const r = v("MX_CURP", s);
    if (r.ok) return undefined;
    if (r.reason === "invalid_date") return "impossible or future birth date rejected";
    if (r.reason === "invalid_format" && (!/[AEIOUX]/.test(s[1]!) || /[AEIOU]/.test(s.slice(13, 16))))
      return "RENAPO: 2nd char vowel/X, 14-16 consonants";
    return undefined;
  };

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({ spec: spec(documents, "MX_CURP"), generate: gen, samples: 5000, allow });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_CURP"),
      generate: gen,
      samples: 5000,
      allow: (s, ours) => {
        // idnumbers accepts X too, so only the rejection fixes apply.
        if (ours) return undefined;
        return allow(s, ours);
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("MX_RFC", () => {
  test("persona física", () => {
    expect(v("MX_RFC_PF", "PEMJ-800101-AB6")).toMatchObject({
      ok: true,
      normalized: "PEMJ800101AB6",
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, extra: { homoclave: "AB6" } },
    });
    expect(v("MX_RFC_PF", "XAXX010101000")).toMatchObject({ ok: true, data: { extra: { generic: true } } });
    expect(v("MX_RFC_PF", "PEMJ800101AB5")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("MX_RFC_PF", rfcPf("PEMJ010229AB"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("MX_RFC_PF", rfcPf("PUTO800101AB"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("MX_RFC_PF", rfcPf("PEÑA800101AB"))).toMatchObject({ ok: true });
    expect(v("MX_RFC_PF", rfcPf("PEÑA800101AB").toLowerCase())).toMatchObject({ ok: true });
  });

  test("published SAT examples verify", () => {
    // Doc examples used across libraries; confirms the value table and weights.
    expect(rfcCheckChar("GODE561231GR")).toBe("8");
    expect(rfcCheckChar(" MAB9307148T")).toBe("4");
  });

  test("persona moral", () => {
    expect(v("MX_RFC_PM", "ABC-010203-XYA")).toMatchObject({ ok: true, data: { extra: { homoclave: "XYA", incorporationDate: "2001-02-03" } } });
    expect(v("MX_RFC_PM", rfcPm("A&C990230XY"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("MX_RFC_PM", "ABC010203XY1")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  const fix = (code: string) => (_s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v(code, _s);
    return !r.ok && r.reason === "invalid_date" ? "impossible date rejected" : undefined;
  };

  test("RFC PF agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_RFC_PF"),
      generate: (r) => {
        const body = fromTemplate("AAAA##[01]#[0-3]#XX", r);
        return body + (r() < 0.85 ? rfcCheckChar(body) : fromTemplate("[0-9A]", r));
      },
      samples: 5000,
      allow: fix("MX_RFC_PF"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("RFC PM agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_RFC_PM"),
      generate: (r) => {
        const body = fromTemplate("A[A&]A##[01]#[0-3]#XX", r);
        return body + (r() < 0.85 ? rfcCheckChar(" " + body) : fromTemplate("[0-9A]", r));
      },
      samples: 5000,
      allow: fix("MX_RFC_PM"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("MX_NSS", () => {
  test("extracts parts", () => {
    expect(v("MX_NSS", "12-34-56-7890-3")).toMatchObject({
      ok: true,
      data: { region: "12", serial: "7890", extra: { affiliationYear2: "34", birthYear2: "56" } },
    });
    expect(v("MX_NSS", "12345678904")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("MX_NSS", "00000000000")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_NSS"),
      generate: (r) => {
        const b = fromTemplate("##########", r);
        return b + (r() < 0.5 ? luhnCheckDigit(b) : fromTemplate("#", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("MX_CLAVE_ELECTOR", () => {
  test("INE layout: YYMMDD then entidad", () => {
    expect(v("MX_CLAVE_ELECTOR", "GMRPRZ85091009H123")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1985-09-10", gender: "male", region: "09", regionName: "Ciudad de México", serial: "123" },
    });
    // born on the 25th: nationid's YY-EE-MM-DD reading rejects this
    expect(v("MX_CLAVE_ELECTOR", "GMRPRZ85092532M123")).toMatchObject({ ok: true, data: { gender: "female", regionName: "Zacatecas" } });
    expect(v("MX_CLAVE_ELECTOR", "GMRPRZ85022915H123")).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("MX_CLAVE_ELECTOR", "GMRPRZ85091033H123")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  /** nationid's own rule (YY, entidad 01-32, MM, DD, sex H/M), to show disagreements come from the layout. */
  const nationidLayout = (s: string) => {
    const e = Number(s.slice(8, 10));
    const m = Number(s.slice(10, 12));
    const d = Number(s.slice(12, 14));
    return e >= 1 && e <= 32 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && /[HM]/.test(s[14]!);
  };
  test("agrees with nationid except the layout fix", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_CLAVE_ELECTOR"),
      generate: (r) => fromTemplate("AAAAAA##[01]#[0-2]#[0-3]#[HMX]###", r),
      samples: 5000,
      allow: (s, ours) => {
        const r = v("MX_CLAVE_ELECTOR", s);
        if (ours && !nationidLayout(s)) return "INE layout YYMMDD+EE (nationid reads YY EE MM DD)";
        if (!ours && !r.ok && (r.reason === "invalid_date" || r.reason === "invalid_format") && nationidLayout(s))
          return "INE layout YYMMDD+EE (nationid reads YY EE MM DD)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("MX_PASAPORTE", () => {
  test("shape", () => {
    expect(v("MX_PASAPORTE", "g12345678")).toMatchObject({ ok: true });
    expect(v("MX_PASAPORTE", "123456789")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "MX_PASAPORTE"),
      generate: (r) => fromTemplate("[A-Z0-9]########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
