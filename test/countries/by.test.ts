import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/by.js";
import { describeContract } from "../helpers/contract.js";
import { check, REF, spec } from "../helpers/oracle.js";

const ID = spec(documents, "BY_ID");
const UNP = spec(documents, "BY_UNP");
describeContract(documents);

describe("BY_ID", () => {
  test("pre-2012 number: sex, century, birth date, region, citizenship", () => {
    expect(check(ID, "3010185A001PB1", REF)).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1985-01-01",
        birthYear: 1985,
        gender: "male",
        citizenship: "citizen",
        region: "A",
        regionName: "Minsk",
        serial: "001",
        extra: { scheme: "pre-2012", citizenshipCode: "PB" },
      },
    });
    expect(check(ID, "6150310H123PB7", REF)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "2010-03-15", gender: "female", regionName: "Gomel Region" },
    });
    expect(check(ID, "2311299M001PB0", REF)).toMatchObject({ ok: true, data: { dateOfBirth: "1899-12-31" } });
  });

  // Illustrative numbers published by blog.100ct.by (3140926A123PB4) and
  // forum.onliner.by (7123456A001PB3). Neither satisfies the reported 7-3-1
  // check digit, which is why the check digit isn't verified.
  test("published samples", () => {
    expect(check(ID, "3140926A123PB4", REF)).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1926-09-14", gender: "male", serial: "123" },
    });
    expect(check(ID, "7123456A001PB3", REF)).toMatchObject({ ok: true, data: { serial: "001", extra: { scheme: "2012" } } });
  });

  test("Cyrillic lookalike letters are accepted", () => {
    expect(check(ID, "7123456А001РВ3", REF)).toMatchObject({ ok: true, normalized: "7123456A001PB3" });
  });

  test("unknown region letter and citizenship code pass through", () => {
    expect(check(ID, "4010190Z001BA2", REF)).toMatchObject({ ok: true, data: { region: "Z", extra: { citizenshipCode: "BA" } } });
    expect(check(ID, "4010190Z001BA2", REF).data).not.toHaveProperty("regionName");
  });

  test("invalid_date", () => {
    expect(check(ID, "3310285A001PB1", REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 31 Feb
    expect(check(ID, "5010130A001PB1", REF)).toMatchObject({ ok: false, reason: "invalid_date" }); // 2030
  });

  test("invalid_format", () => {
    expect(check(ID, "7123456B001PB3", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // 2012+: letter must be A
    expect(check(ID, "7123456A001XX3", REF)).toMatchObject({ ok: false, reason: "invalid_format" }); // 2012+: must be PB
    expect(check(ID, "8010185A001PB1", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ID, "3010185A00PPB1", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("invalid_length", () => {
    expect(check(ID, "3010185A001PB", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("BY_UNP", () => {
  test("individual and entity shapes", () => {
    expect(check(UNP, "AB1234567", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "individual" } } });
    expect(check(UNP, "123456789", REF)).toMatchObject({ ok: true, data: { extra: { holderType: "entity_or_sole_trader" } } });
    expect(check(UNP, "ав1234567", REF)).toMatchObject({ ok: true, normalized: "AB1234567" });
  });

  test("rejections", () => {
    expect(check(UNP, "A12345678", REF)).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(UNP, "12345678", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
