# idLense

Zero-dependency validation and data extraction for national ID numbers worldwide.
Give it a number, with or without a country. It tells you whether the number is valid, which
document it is, and what it encodes: date of birth, age, gender, citizenship, region and serial.

The rules are our own code, one module per country in `src/countries/`. They started as ports of
several open-source libraries (see `THIRD_PARTY_NOTICES.md`), were checked against issuer and
legal sources, fixed where upstream was wrong, and extended with countries none of them cover.
Each module's header lists its sources and what it fixes.

- [ID_NUMBERS.md](./ID_NUMBERS.md) explains how each country's numbers work: structure, check digit and what is extracted.
- [COVERAGE.md](./COVERAGE.md) is the generated one-line-per-country summary.
- [ID_NUMBERS_FINDINGS.md](./ID_NUMBERS_FINDINGS.md) lists open research leads where sources disagree with a module.

## Usage

```ts
import { identify, validateDocument, isValidId, listSupportedCountries } from "idLense";

identify("8001015009087", { country: "ZA" });
// {
//   status: "valid",
//   match: {
//     country: "ZA", countryAlpha3: "ZAF", countryName: "South Africa",
//     documents: [{ code: "ZA_ID", name: "South African Identity Number", purpose: "identity",
//                   checksumVerified: true, confidence: "high", ... }],
//     normalized: "8001015009087", formatted: "800101 5009 087",
//     data: { dateOfBirth: "1980-01-01", birthYear: 1980, age: 46, gender: "male",
//             citizenship: "citizen", serial: "5009", extra: {} }
//   },
//   matches: [/* same */], rejections: []
// }

identify("17054026641");                    // country detected: Norway
identify("57054026635", { country: "NO" }); // D-number → documents[0].code "NO_DNR"
validateDocument("ZA_ID", "800101 5009 087");
isValidId("8001015009086", "ZA");           // false (checksum)
listSupportedCountries();                   // every country and document code
```

### Options for `identify`

| Option | Default | |
|---|---|---|
| `country` | — | Alpha-2 or alpha-3, any case. Leave out to detect. |
| `documentTypes` | — | e.g. `["ZA_ID"]`. Overrides `purposes`/`holders`. |
| `purposes` | `identity`, `social_security`, `migratory` | Also: `tax`, `voter`, `driver_license`, `passport`, `health`. |
| `holders` | `person`, `both` | Add `entity` for company/VAT numbers. |
| `includeUnchecked` | `false` | When detecting, also try documents without a check digit. |
| `minConfidence` | `moderate` | When detecting, skip `low`-confidence rules. |
| `preferCountries` | `[]` | Rank these first when several countries match. |
| `referenceDate` | today | For age and century inference. |

### Status and reasons

- `valid`: one country matched.
- `ambiguous`: no country was given and several accept the number. Read `matches`, best first.
- `invalid`: `reason` is one of `empty`, `unsupported_country`, `invalid_length`,
  `invalid_format`, `invalid_range`, `invalid_date`, `invalid_checksum`, `invalid`. With a country,
  `rejections` gives the reason for each document that was tried.

## Design notes

- **Dates are `YYYY-MM-DD` strings.** No `Date` objects, so results never shift with the server's
  timezone, which was a bug in one upstream library.
- **Guessing the country** only uses documents with a check digit and at least `moderate`
  confidence. Shape-only formats (most passports, US SSN) would match almost any number.
- **Confidence** says how well the rule is sourced: `high` = issuer or law, `moderate` =
  consistent secondary sources, `low` = a single source.
- **This checks structure only.** A valid number may still never have been issued. Confirming
  that needs a registry lookup (for SA, a DHA verification provider).

## Development

```sh
pnpm test        # regenerates the country index, runs vitest
pnpm typecheck
pnpm build       # → dist/ (ESM + .d.ts), Node >= 22
```

To add a country, see [PORTING.md](./PORTING.md). Tests compare each ported module against
its upstream library on thousands of generated numbers. Every disagreement must be a documented
fix. Upstream's answers are recorded in `test/fixtures/upstream/`, so none of those libraries is installed,
even as a dev dependency.
