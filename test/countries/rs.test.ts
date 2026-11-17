import { describe, expect, test } from "vitest";
import { documents, jmbgArea, jmbgCheck } from "../../src/countries/rs.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const RS = spec(documents, "RS_JMBG");
describeContract(documents);

/** Append the JMBG check digit. */
const withJmbgCheck = (first12: string) => first12 + jmbgCheck(first12).k;

describe("RS_JMBG", () => {
  test("extracts everything", () => {
    expect(check(RS, "0101990710008")).toMatchObject({
      ok: true,
      formatted: "0101990710008",
      data: {
        dateOfBirth: "1990-01-01",
        birthYear: 1990,
        gender: "male",
        region: "71",
        regionName: "Belgrade",
        serial: "000",
        extra: { registerArea: "Central Serbia" },
      },
    });
    expect(check(RS, withJmbgCheck("150500580512"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2005-05-15", gender: "female", region: "80", regionName: "Novi Sad", serial: "512" },
    });
  });

  test("numbers from other republics and foreigners", () => {
    // Born in Sarajevo before 1991, citizen of Serbia: upstream rejects
    expect(check(RS, withJmbgCheck("010197017123"))).toMatchObject({
      ok: true,
      data: { region: "17", regionName: "Sarajevo", extra: { registerArea: "Bosnia and Herzegovina" } },
    });
    const r = check(RS, withJmbgCheck("010198506123"));
    expect(r).toMatchObject({ ok: true, data: { citizenship: "foreigner", region: "06" } });
    expect(check(RS, withJmbgCheck("010198583123"))).toMatchObject({ ok: true, data: { region: "83" } });
    expect(check(RS, withJmbgCheck("010188583123"))).toMatchObject({ ok: true, data: { birthYear: 1885 } });
  });

  test("rejections", () => {
    for (const rr of ["20", "40", "90", "97", "99"]) {
      expect(check(RS, withJmbgCheck("0101990" + rr + "000")), rr).toMatchObject({
        ok: false,
        reason: "invalid_range",
      });
    }
    expect(check(RS, withJmbgCheck("300299071000"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(RS, withJmbgCheck("010150071000"))).toMatchObject({ ok: false, reason: "invalid_date" }); // 2150
    expect(check(RS, withJmbgCheck("171102671000"))).toMatchObject({ ok: false, reason: "invalid_date" }); // future
    expect(check(RS, "0101990710007")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(RS, "3201990710008")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(RS, "010199071000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("check digit rule", () => {
    // remainder 1 → K 0 accepted outside Slovenia (Wikipedia: m = 10 → 0)
    let found = "";
    for (let s = 0; s < 1000 && !found; s++) {
      const body = "010199071" + String(s).padStart(3, "0");
      if (jmbgCheck(body).remainderOne) found = body;
    }
    expect(found).not.toBe("");
    expect(check(RS, found + "0")).toMatchObject({ ok: true });
    expect(jmbgArea(50)).toBe("Slovenia");
    expect(jmbgArea(20)).toBeUndefined();
  });

  test("input forms", () => {
    for (const s of ["0101990 71 000 8", "0101990-710008", " 0101990710008\n"]) expect(check(RS, s).ok, s).toBe(true);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: RS,
      generate: (r) => fromTemplate("[0-2]#[01]#[089]##[0-9]#####", r),
      samples: 20000,
      allow: (s, ours) => {
        const rr = Number(s.slice(7, 9));
        const reason = check(RS, s);
        if (ours && rr >= 10 && rr <= 69) return "pre-1991 registration in another republic accepted";
        if (ours && rr === 0) return "naturalized-citizen code 00 accepted";
        if (!ours && !reason.ok && reason.reason === "invalid_range") return "unallocated codes 90, 97-99 rejected";
        if (!ours && !reason.ok && reason.reason === "invalid_date") return "future birth date rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
