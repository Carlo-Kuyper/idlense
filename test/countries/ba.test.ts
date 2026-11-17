import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/ba.js";
import { jmbgCheck } from "../../src/countries/rs.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const D = spec(documents, "BA_JMBG");
const withCheck = (first12: string) => first12 + jmbgCheck(first12).k;
describeContract(documents);

describe("BA_JMBG", () => {
  test("extracts everything", () => {
    expect(check(D, "0101990170003")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1990-01-01",
        birthYear: 1990,
        gender: "male",
        region: "17",
        regionName: "Sarajevo",
        serial: "000",
        extra: { registerArea: "Bosnia and Herzegovina" },
      },
    });
    expect(check(D, withCheck("290200017555"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2000-02-29", gender: "female", serial: "555" },
    });
  });

  test("foreigners and other republics", () => {
    expect(check(D, withCheck("010198501123"))).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
    expect(check(D, withCheck("010197071123"))).toMatchObject({ ok: true, data: { regionName: "Belgrade" } });
    expect(check(D, withCheck("010197051123"))).toMatchObject({ ok: true, data: { extra: { registerArea: "Slovenia" } } });
  });

  test("rejections", () => {
    expect(check(D, withCheck("010199020000"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(D, withCheck("010199098000"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(D, withCheck("290201517555"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(D, withCheck("010130517555"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(D, "0101990170003".slice(0, 12) + ((Number("0101990170003"[12]) + 1) % 10))).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(D, "011399017" + "0000")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(D, "0101990170003".slice(1))).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: D,
      generate: (r) => fromTemplate("[0-2]#[01]#[089]##[0-9]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        const rr = Number(s.slice(7, 9));
        const r = check(D, s, REF);
        if (ours && rr >= 51 && rr <= 59) return "Slovenian register codes 51-59 accepted";
        if (!ours && !r.ok && r.reason === "invalid_date") return "future birth date rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
