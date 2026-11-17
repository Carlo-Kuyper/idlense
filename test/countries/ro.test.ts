import { describe, expect, test } from "vitest";
import { cnpCheckDigit, cuiCheckDigit, documents } from "../../src/countries/ro.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const CNP = spec(documents, "RO_CNP");
const VAT = spec(documents, "RO_VAT");
describeContract(documents);

const cnp = (first12: string) => first12 + cnpCheckDigit(first12);

describe("RO_CNP", () => {
  test("extracts everything", () => {
    expect(check(CNP, "1800101221144")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1980-01-01",
        birthYear: 1980,
        gender: "male",
        citizenship: "citizen",
        region: "22",
        regionName: "Iași",
        serial: "114",
      },
    });
    expect(check(CNP, "2800101400018")).toMatchObject({ ok: true, data: { gender: "female", regionName: "București" } });
  });

  test("century and foreigner digits", () => {
    expect(check(CNP, cnp("399123101001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31", gender: "male" } });
    expect(check(CNP, cnp("610061501001"))).toMatchObject({ ok: true, data: { dateOfBirth: "2010-06-15", gender: "female" } });
    expect(check(CNP, cnp("750101770001"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1950-10-17", gender: "male", citizenship: "resident", region: "70", regionName: "Any county" },
    });
    // 7/8: latest past century, not upstream's fixed YY<50 → 20YY
    expect(check(CNP, cnp("830010112001"))).toMatchObject({ ok: true, data: { dateOfBirth: "1930-01-01" } });
    expect(check(CNP, cnp("820010112001"))).toMatchObject({ ok: true, data: { dateOfBirth: "2020-01-01" } });
    const nine = check(CNP, cnp("950101440010"));
    expect(nine).toMatchObject({ ok: true, data: { citizenship: "foreigner", dateOfBirth: "1950-10-14" } });
    expect(nine.ok && nine.data.gender).toBeUndefined();
  });

  test("rejections", () => {
    expect(check(CNP, "1800101221145")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(CNP, cnp("180010199114"))).toMatchObject({ ok: false, reason: "invalid_range" }); // county 99
    expect(check(CNP, cnp("180010149114"))).toMatchObject({ ok: false, reason: "invalid_range" }); // county 49
    expect(check(CNP, cnp("180010122000"))).toMatchObject({ ok: false, reason: "invalid_range" }); // NNN 000
    expect(check(CNP, cnp("181022922114"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 1981-02-29
    expect(check(CNP, cnp("530010122114"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030, future
    expect(check(CNP, "0800101221144")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(CNP, "180010122114")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(CNP, cnp("181010180114"))).toMatchObject({ ok: true, data: { region: "80" } });
  });

  test("remainder 10 gives check digit 1", () => {
    // find a body whose weighted sum is 10 mod 11
    let body = "";
    for (let n = 0; n < 1000 && !body; n++) {
      const b = "1800101221" + String(n).padStart(3, "0").slice(1);
      const w = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
      let s = 0;
      for (let i = 0; i < 12; i++) s += Number(b[i]) * w[i]!;
      if (s % 11 === 10 && b.slice(9) !== "000") body = b;
    }
    expect(body).not.toBe("");
    expect(check(CNP, body + "1").ok).toBe(true);
    expect(check(CNP, body + "0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  const gen = (r: () => number) => {
    const body = fromTemplate("[1-9]##[01]#[0-3]#[0-5]####", r);
    return r() < 0.8 ? body + cnpCheckDigit(body) : body + fromTemplate("#", r);
  };

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: CNP,
      generate: gen,
      samples: 20000,
      allow: (s, ours) => {
        const r = check(CNP, s);
        if (!ours && !r.ok) {
          if (r.reason === "invalid_range") return "county 99 / 49-50 / NNN 000 rejected";
          if (r.reason === "invalid_date") return "future or impossible birth date rejected";
          return undefined;
        }
        if (ours && s[0] === "9") return "S=9 (foreigners) accepted";
        if (ours && /^8[0-3]$/.test(s.slice(7, 9))) return "counties 80-83 accepted";
        if (ours && (s[0] === "7" || s[0] === "8")) return "resident century inferred from the latest past date";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("RO_VAT", () => {
  test("valid and prefixed", () => {
    expect(check(VAT, "18547290")).toMatchObject({ ok: true, normalized: "18547290" });
    expect(check(VAT, "RO 18547290")).toMatchObject({ ok: true, normalized: "18547290" });
    expect(check(VAT, "ro18547290")).toMatchObject({ ok: true });
    expect(check(VAT, "18547291")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(VAT, "08547290")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(VAT, "12345678901")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(VAT, "1234567" + cuiCheckDigit("1234567"))).toMatchObject({ ok: true });
  });

  test("agrees with nationid RO_VAT", () => {
    const res = compareWithOracle({
      spec: VAT,
      generate: (r) => {
        const body = fromTemplate("[1-9]" + "#".repeat(1 + Math.floor(r() * 8)), r);
        return r() < 0.5 ? body + cuiCheckDigit(body) : body + fromTemplate("#", r);
      },
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
