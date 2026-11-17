import { describe, expect, test } from "vitest";
import { documents, nirKey, tvaKey } from "../../src/countries/fr.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
const nir = (b: string) => b + String(nirKey(b)).padStart(2, "0");
describeContract(documents);

describe("FR_NIR", () => {
  test("extracts", () => {
    expect(v("FR_NIR", "1 85 05 78 006 084 91")).toMatchObject({
      ok: true,
      formatted: "1 85 05 78 006 084 91",
      data: { birthYear: 1985, gender: "male", region: "78", serial: "084", extra: { birthMonth: 5, commune: "006", provisional: false } },
    });
    expect(v("FR_NIR", nir("2100399350123"))).toMatchObject({
      ok: true,
      data: { birthYear: 2010, gender: "female", region: "99", regionName: "born abroad", extra: { birthCountryCode: "350" } },
    });
    expect(v("FR_NIR", nir("2850597105123"))).toMatchObject({ ok: true, data: { region: "971", extra: { commune: "05" } } });
    expect(v("FR_NIR", nir("8854078006084"))).toMatchObject({ ok: true, data: { gender: "female", extra: { provisional: true } } });
    expect(v("FR_NIR", nir("1400596123456"))).toMatchObject({ ok: true, data: { region: "96" } });
    expect(v("FR_NIR", nir("1600596123456"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("FR_NIR", nir("1261278006084"))).toMatchObject({ ok: true, data: { birthYear: 1926 } }); // Dec 2026 is future
  });
  test("Corsica", () => {
    const corsica = nir("18005" + "2A" + "004" + "123");
    expect(corsica.slice(-2)).toBe(String(97 - (Number("1800519004123") % 97)).padStart(2, "0"));
    expect(v("FR_NIR", corsica)).toMatchObject({ ok: true, data: { region: "2A" } });
    expect(v("FR_NIR", nir("160052A004123"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("FR_NIR", nir("1600520004123"))).toMatchObject({ ok: true });
    expect(v("FR_NIR", nir("1800520004123"))).toMatchObject({ ok: false, reason: "invalid_range" });
  });
  test("rejections", () => {
    expect(v("FR_NIR", "185057800608492")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("FR_NIR", "585057800608491")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("FR_NIR", "185130000608491")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("FR_NIR", "185057800600091")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("[123478]##[0-9]#[0-9][0-9AB]######", r).replace(/^(.{5})([0-9])[AB]/, "$1$2" + "0");
    const b = r() < 0.15 ? body.slice(0, 5) + (r() < 0.5 ? "2A" : "2B") + body.slice(7) : body;
    return r() < 0.8 ? nir(b) : b + fromTemplate("##", r);
  };
  const ourReason = (s: string) => {
    const x = v("FR_NIR", s);
    return x.ok ? undefined : x.reason;
  };
  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "FR_NIR"),
      generate: gen,
      samples: 20000,
      allow: (s, ours) => {
        if (!ours && ourReason(s) === "invalid_range") return "Corsica code vs birth year";
        if (ours && s.slice(5, 7) === "96") return "Tunisia (96) accepted";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "FR_NIR"),
      generate: gen,
      samples: 20000,
      allow: (s, ours) => {
        if (!ours && ourReason(s) === "invalid_range") return "Corsica code vs birth year";
        if (ours && s.slice(5, 7) === "96") return "Tunisia (96) accepted";
        if (ours && !/^(0[1-9]|1[0-2]|20|30|40|50|99)$/.test(s.slice(3, 5))) return "fictitious month accepted";
        if (ours && "4".includes(s[0]!)) return "provisional sex digit 4 accepted";
        if (!ours && s.slice(5, 7) === "00") return "département 00 rejected";
        if (!ours && s.slice(10, 13) === "000") return "order number 000 rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("FR companies", () => {
  test("SIREN / SIRET / TVA", () => {
    expect(v("FR_SIREN", "732 829 320")).toMatchObject({ ok: true, formatted: "732 829 320" });
    expect(v("FR_SIREN", "732829321")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("FR_SIRET", "732 829 320 00009")).toMatchObject({ ok: true, data: { serial: "00009", extra: { siren: "732829320" } } });
    expect(v("FR_SIRET", "35600000000001")).toMatchObject({ ok: true }); // La Poste: digit sum 15
    expect(v("FR_TVA", "FR 40 303 265 045")).toMatchObject({ ok: true, data: { extra: { siren: "303265045", keyVerified: true } } });
    expect(v("FR_TVA", "40303265045")).toMatchObject({ ok: true, normalized: "FR40303265045" });
    expect(v("FR_TVA", "FR41303265045")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("FR_TVA", "FRK7303265045")).toMatchObject({ ok: true, data: { extra: { keyVerified: false } } });
    expect(tvaKey("303265045")).toBe(40);
  });
  test("agree with nationid", () => {
    const siren = compareWithOracle({ spec: spec(documents, "FR_SIREN"), generate: (r) => fromTemplate("#########", r) });
    expect(siren.unexplained).toEqual([]);
    expect(siren.validSeen).toBeGreaterThan(20);
    const siret = compareWithOracle({
      spec: spec(documents, "FR_SIRET"),
      generate: (r) => (r() < 0.1 ? fromTemplate("356000000#####", r) : fromTemplate("##############", r)),
      samples: 10000,
      allow: (s, ours, theirs) => {
        if (!ours && theirs && !s.startsWith("356000000")) return "SIREN part must be a valid SIREN";
        return undefined;
      },
    });
    expect(siret.unexplained).toEqual([]);
    expect(siret.validSeen).toBeGreaterThan(20);
    const tva = compareWithOracle({
      spec: spec(documents, "FR_TVA"),
      generate: (r) => {
        const s = fromTemplate("########", r);
        let siren = s + "0";
        for (let c = 0; c < 10; c++) if (v("FR_SIREN", s + c).ok) siren = s + c;
        const key = r() < 0.5 ? String(tvaKey(siren)).padStart(2, "0") : fromTemplate("[0-9A-Z][0-9A-Z]", r);
        return "FR" + key + siren;
      },
      samples: 5000,
    });
    expect(tva.unexplained).toEqual([]);
    expect(tva.validSeen).toBeGreaterThan(20);
  });
});
