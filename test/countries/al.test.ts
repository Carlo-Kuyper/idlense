import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/al.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";
import { runDocument } from "../../src/core/run.js";

const NID = spec(documents, "AL_NID");
const NIPT = spec(documents, "AL_NIPT");
describeContract(documents);

describe("AL_NID", () => {
  test("issuer specimen", () => {
    expect(check(NID, "I05101999Q")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-01", birthYear: 1980, gender: "female", serial: "999" },
    });
    expect(check(NID, "j50101001a")).toMatchObject({ ok: true, normalized: "J50101001A", data: { dateOfBirth: "1995-01-01", gender: "male" } });
    expect(check(NID, "K91231001B")).toMatchObject({ ok: true, data: { dateOfBirth: "2009-12-31" } });
    expect(check(NID, "085101001C")).toMatchObject({ ok: true, data: { dateOfBirth: "1808-01-01", gender: "female" } });
  });

  test("rejections", () => {
    expect(check(NID, "M90101001A")).toMatchObject({ ok: false, reason: "invalid_date" }); // 2029
    expect(check(NID, "J50229001A")).toMatchObject({ ok: false, reason: "invalid_date" }); // 1995-02-29
    expect(check(NID, "J51301001A")).toMatchObject({ ok: false, reason: "invalid_format" }); // month 13
    expect(check(NID, "J50101001X")).toMatchObject({ ok: false, reason: "invalid_format" }); // letter after W
    expect(check(NID, "U50101001A")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NID, "J5010100A")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: NID,
      generate: (r) => fromTemplate("[0-9A-T]#[0156]#[0-3]####[A-Z]", r),
      samples: 10000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const o = runDocument(NID, s, REF).outcome;
        if (!o.ok && o.reason === "invalid_date") return "future birth date rejected";
        if (!o.ok && o.reason === "invalid_format" && /[X-Z]$/.test(s)) return "check letter beyond W rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("AL_NIPT", () => {
  test("shape", () => {
    expect(check(NIPT, "K12113002H")).toMatchObject({ ok: true, data: { serial: "002", extra: { issueYear: 2001 } } });
    expect(check(NIPT, "J61826001A")).toMatchObject({ ok: true, data: { extra: { issueYear: 1996 } } });
    expect(check(NIPT, "A12113002H")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NIPT, "K12113002")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
