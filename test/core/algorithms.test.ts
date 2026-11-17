import { expect, test } from "vitest";
import {
  dammValid,
  icaoCheckDigit,
  iso7064HybridCheck,
  luhnCheckDigit,
  luhnValid,
  mod11_10Valid,
  mod11_2Check,
  mod97,
  verhoeffCheckDigit,
  verhoeffValid,
} from "../../src/core/algorithms.js";

test("luhn", () => {
  expect(luhnValid("79927398713")).toBe(true);
  expect(luhnValid("79927398710")).toBe(false);
  expect(luhnCheckDigit("7992739871")).toBe(3);
  expect(luhnValid("8001015009087")).toBe(true);
});

test("verhoeff", () => {
  expect(verhoeffCheckDigit("236")).toBe(3);
  expect(verhoeffValid("2363")).toBe(true);
  expect(verhoeffValid("2364")).toBe(false);
});

test("damm", () => {
  expect(dammValid("5724")).toBe(true);
  expect(dammValid("5727")).toBe(false);
});

test("iso 7064", () => {
  // German Steuer-ID style MOD 11,10
  expect(mod11_10Valid("797")).toBe(true);
  expect(mod11_10Valid("86095742719")).toBe(true);
  expect(iso7064HybridCheck("79", 10)).toBe(7);
  // China resident ID (MOD 11-2)
  expect(mod11_2Check("11010519491231002")).toBe("X");
  // IBAN-style MOD 97-10
  expect(mod97("3214282912345698765432161182")).toBe(1);
});

test("icao 9303", () => {
  // ICAO Doc 9303 specimen: L898902C3 → check digit 6
  expect(icaoCheckDigit("L898902C3")).toBe(6);
  expect(icaoCheckDigit("740812")).toBe(2);
});
