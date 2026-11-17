# How ID numbers work, country by country

This is a reference for each of the 343 ID numbers (from 164 countries) the library understands: its structure, what each part
encodes, how its check digit is computed, who issues it, and what the library pulls out of it.
Each section was written from the country's module in `src/countries/<cc>.ts` and checked against
public sources, which are linked at the end of each document. A **Caveats** paragraph flags
anything that couldn't be confirmed.

[`COVERAGE.md`](COVERAGE.md) is the generated one-line-per-country summary. This document is the
long-form explanation, and it isn't regenerated, so update it by hand when a module's rules change.

## Reading a section

- **Code** (`ZA_ID`): the document code the library uses, `{country}_{type}`.
- **Check digit:** the algorithm that guards against typos. "None known" means the library can only
  check the length and character pattern, so a mistyped number may still pass.
- **Confidence:**
  - **High:** an official or well-established specification.
  - **Moderate:** a consistent secondary source.
  - **Low:** inferred from samples or a single unofficial source.
- **Country guessing:** when you call `identify()` without a country, only documents with a check
  digit and at least moderate confidence are tried. Format-only and low-confidence documents are used
  only when you pass the country.
- **Dates:** two-digit years are resolved to the most recent century that puts the date in the past,
  unless the number encodes the century itself.

## Common check-digit algorithms

Many countries reuse the same few algorithms. They are explained once here, and the country
sections refer back to them.

### Luhn (mod 10)

Starting from the rightmost digit of the number *without* its check digit, double every second
digit, beginning with that rightmost one. If doubling gives more than 9, subtract 9. Add up all the
digits. The check digit is whatever brings the total up to a multiple of 10.

Example: `7992739871` → total 67 → check digit **3** → `79927398713`.
Used by South Africa, Canada SIN, Israel, Sweden and others.

### Weighted sum mod 11 ("11 minus the remainder")

Multiply each digit by a fixed weight, add the products, and take the remainder mod 11. The check
digit is `11 − remainder`. Each country decides what to do with the two awkward results: 11
usually becomes 0, and 10 becomes 0, `X` or `K`, or the number is never issued.

Example with weights 9…2: `12345678` → 9+16+21+24+25+24+21+16 = 156 → 156 mod 11 = 2 → check digit
11 − 2 = **9**.

A common variant applies the weights 2, 3, 4, 5, 6, 7, 2, 3… from the right. Brazil, Chile and many
others use it.

### Verhoeff

This algorithm is based on the dihedral group D5, and it catches every single-digit error and every
swap of adjacent digits. It works through fixed multiplication, permutation and inverse tables.
Example: `236` → check digit **3**. India's Aadhaar uses it.

### Damm

This algorithm runs each digit through a 10×10 quasigroup table, carrying an interim digit
from one step to the next. A number is valid when the final interim digit is 0. Example: `5724` is
valid.

### ISO 7064

- **MOD 11-2:** a check value from 0 to 10, with 10 written as `X`. China's resident ID uses it, for
  example `11010519491231002` → **X**.
- **MOD 11,10 (hybrid):** a running mod-10/mod-11 calculation that gives one decimal digit. Example:
  `79` → **7**. Croatia's OIB and Germany's Steuer-ID use it.
- **MOD 37,36:** the same idea as MOD 11,10, extended to letters and digits.
- **MOD 97-10:** the whole number, with letters read as 10–35, must leave a remainder of 1 when
  divided by 97. IBANs and several VAT numbers use it.

### ICAO 9303 (passport / MRZ)

Give each character a value: digits as themselves, A–Z as 10–35, and `<` as 0. Multiply the values
by the repeating weights 7, 3, 1, add the products, and take the result mod 10. Example: passport
number `L898902C3` → **6**, and birth date `740812` → **2**.

## Countries

[AD](#andorra-ad) · [AE](#united-arab-emirates-ae) · [AF](#afghanistan-af) · [AI](#anguilla-ai) · [AL](#albania-al) · [AM](#armenia-am) · [AO](#angola-ao) · [AR](#argentina-ar) · [AT](#austria-at) · [AU](#australia-au) · [AW](#aruba-aw) · [AZ](#azerbaijan-az) · [BA](#bosnia-and-herzegovina-ba) · [BB](#barbados-bb) · [BD](#bangladesh-bd) · [BE](#belgium-be) · [BG](#bulgaria-bg) · [BH](#bahrain-bh) · [BJ](#benin-bj) · [BN](#brunei-bn) · [BO](#bolivia-bo) · [BR](#brazil-br) · [BT](#bhutan-bt) · [BW](#botswana-bw) · [BY](#belarus-by) · [BZ](#belize-bz) · [CA](#canada-ca) · [CD](#democratic-republic-of-the-congo-cd) · [CH](#switzerland-ch) · [CK](#cook-islands-ck) · [CL](#chile-cl) · [CM](#cameroon-cm) · [CN](#china-cn) · [CO](#colombia-co) · [CR](#costa-rica-cr) · [CU](#cuba-cu) · [CW](#curaçao-cw) · [CY](#cyprus-cy) · [CZ](#czechia-cz) · [DE](#germany-de) · [DK](#denmark-dk) · [DM](#dominica-dm) · [DO](#dominican-republic-do) · [DZ](#algeria-dz) · [EC](#ecuador-ec) · [EE](#estonia-ee) · [EG](#egypt-eg) · [ES](#spain-es) · [ET](#ethiopia-et) · [FI](#finland-fi) · [FJ](#fiji-fj) · [FO](#faroe-islands-fo) · [FR](#france-fr) · [GB](#united-kingdom-gb) · [GD](#grenada-gd) · [GE](#georgia-ge) · [GG](#guernsey-gg) · [GH](#ghana-gh) · [GN](#guinea-gn) · [GR](#greece-gr) · [GT](#guatemala-gt) · [HK](#hong-kong-hk) · [HN](#honduras-hn) · [HR](#croatia-hr) · [HT](#haiti-ht) · [HU](#hungary-hu) · [ID](#indonesia-id) · [IE](#ireland-ie) · [IL](#israel-il) · [IM](#isle-of-man-im) · [IN](#india-in) · [IQ](#iraq-iq) · [IR](#iran-ir) · [IS](#iceland-is) · [IT](#italy-it) · [JE](#jersey-je) · [JM](#jamaica-jm) · [JO](#jordan-jo) · [JP](#japan-jp) · [KE](#kenya-ke) · [KG](#kyrgyzstan-kg) · [KH](#cambodia-kh) · [KR](#south-korea-kr) · [KW](#kuwait-kw) · [KZ](#kazakhstan-kz) · [LA](#laos-la) · [LB](#lebanon-lb) · [LC](#saint-lucia-lc) · [LI](#liechtenstein-li) · [LK](#sri-lanka-lk) · [LR](#liberia-lr) · [LS](#lesotho-ls) · [LT](#lithuania-lt) · [LU](#luxembourg-lu) · [LV](#latvia-lv) · [LY](#libya-ly) · [MA](#morocco-ma) · [MD](#moldova-md) · [ME](#montenegro-me) · [MG](#madagascar-mg) · [MH](#marshall-islands-mh) · [MK](#north-macedonia-mk) · [ML](#mali-ml) · [MM](#myanmar-mm) · [MN](#mongolia-mn) · [MO](#macao-mo) · [MT](#malta-mt) · [MU](#mauritius-mu) · [MV](#maldives-mv) · [MX](#mexico-mx) · [MY](#malaysia-my) · [MZ](#mozambique-mz) · [NA](#namibia-na) · [NG](#nigeria-ng) · [NI](#nicaragua-ni) · [NL](#netherlands-nl) · [NO](#norway-no) · [NP](#nepal-np) · [NR](#nauru-nr) · [NZ](#new-zealand-nz) · [OM](#oman-om) · [PA](#panama-pa) · [PE](#peru-pe) · [PG](#papua-new-guinea-pg) · [PH](#philippines-ph) · [PK](#pakistan-pk) · [PL](#poland-pl) · [PS](#palestine-ps) · [PT](#portugal-pt) · [PY](#paraguay-py) · [QA](#qatar-qa) · [RO](#romania-ro) · [RS](#serbia-rs) · [RU](#russia-ru) · [RW](#rwanda-rw) · [SA](#saudi-arabia-sa) · [SC](#seychelles-sc) · [SE](#sweden-se) · [SG](#singapore-sg) · [SI](#slovenia-si) · [SK](#slovakia-sk) · [SM](#san-marino-sm) · [SN](#senegal-sn) · [SO](#somalia-so) · [SR](#suriname-sr) · [SV](#el-salvador-sv) · [SZ](#eswatini-sz) · [TH](#thailand-th) · [TJ](#tajikistan-tj) · [TN](#tunisia-tn) · [TR](#turkey-tr) · [TT](#trinidad-and-tobago-tt) · [TW](#taiwan-tw) · [TZ](#tanzania-tz) · [UA](#ukraine-ua) · [UG](#uganda-ug) · [US](#united-states-us) · [UY](#uruguay-uy) · [UZ](#uzbekistan-uz) · [VE](#venezuela-ve) · [VN](#vietnam-vn) · [ZA](#south-africa-za) · [ZM](#zambia-zm) · [ZW](#zimbabwe-zw)

Territories that use a parent country's numbers and places without a documented format are listed [at the end](#territories-covered-through-a-parent-country).

## Andorra (AD)

### Andorran Tax Register Number — `AD_NRT`

Issued by: Departament de Tributs i de Fronteres (Govern d'Andorra) · Holders: resident and non-resident individuals, legal persons and other entities · Check digit: none known (control letter, algorithm unpublished) · Confidence: moderate

**Format:** 8 characters, one prefix letter, six digits, one control letter, written `F-123456-Z`. Example: `F-123456-Z`.

| Part | Meaning |
|---|---|
| Prefix letter | Holder type: `F` resident individual, `E` non-resident individual or non-resident entity, `A` societat anònima, `L` societat limitada, `C` comunitat de béns, `D` public body, `G` tax group, `O` collective investment scheme, `P` association/foundation, `U` parapublic entity |
| 6 digits | For individuals, the NIA (Número d'Identificació Administrativa). Ranges: `F` 000000–699999, non-resident individuals `E` 800000–999999, `A`/`L` 700000–799999, others 000000–999999 |
| Final letter | Control letter |

Individuals get the NRT automatically when they receive a NIA (Regulation of 11 February 2015, art. 14). Entities must apply for one (art. 17).

**Check digit:** The control letter exists, but its algorithm is not published. The library checks only the pattern and the documented ranges: `F` numbers above 699999 and `A`/`L` numbers outside 700000–799999 are rejected as out of range.

**What the library extracts:** holder type, the six-digit serial (the NIA for individuals), the control letter, and residence for `F` numbers.

**Caveats:** An `E` number can belong to a non-resident person or a non-resident entity, and the number does not tell you which. The library therefore does not range-check `E`.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/andorra-tin.pdf, https://www.bopa.ad/bopa/027013/Documents/ga27013015.pdf

## United Arab Emirates (AE)

### Emirates ID Number — `AE_EID`

Issued by: Federal Authority for Identity, Citizenship, Customs and Port Security (ICP) · Holders: citizens and residents · Check digit: Luhn · Confidence: moderate

**Format:** 15 digits, `784-YYYY-NNNNNNN-C`. Example: `784-1980-1234567-8`.

| Part | Meaning |
|---|---|
| `784` | ISO 3166-1 numeric code of the UAE, the same on every card |
| `YYYY` | Year of birth |
| `NNNNNNN` | Serial |
| `C` | Check digit |

**Check digit:** Luhn over all 15 digits. Starting from the rightmost digit, double every second digit, subtract 9 from any result above 9, and add everything up. The total must be divisible by 10. For `784198012345678` the total is 70, so the number is valid.

**What the library extracts:** birth year and serial. The library rejects birth years outside 1900 to the current year (via the pattern and a reference-date check). Upstream libraries accept any four digits, or reject babies born in the current year.

**Caveats:** ICP does not publish the Luhn rule; it comes from data-loss-prevention classifiers and developer libraries. At least one developer reports numbers that failed Luhn, and some guides say `YYYY` is not always the birth year (for some holders it may be the registration year). Treat the year as a strong hint, not a guarantee.

Sources: https://icp.gov.ae/en/, https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id, https://en.wikipedia.org/wiki/National_identification_number#United_Arab_Emirates, https://learn.microsoft.com/en-us/purview/sit-defn-uae-identity-card-number

## Afghanistan (AF)

### Afghan Electronic National Identity Card Number — `AF_TAZKIRA`

Issued by: National Statistics and Information Authority (NSIA) · Holders: Afghan citizens · Check digit: none known · Confidence: moderate

**Format:** 13 digits, written `YYYY-MMXX-XXXXX`. Example: `1400-0101-12345`.

| Part | Meaning |
|---|---|
| `YYYY` | Year of issue in the Solar Hijri calendar (1397 = 2018, when the e-Tazkira started) |
| `MM` | Month of issue, 01–12 |
| `XX XXXXX` | Serial. The last digit of the third group reportedly encodes sex, but the values are not published |

The e-Tazkira number is unrelated to the register reference on the old paper Tazkira.

**Check digit:** None documented. The library checks the length and pattern, and rejects issue years before 1397 or after the current Solar Hijri year.

**What the library extracts:** Solar Hijri issue year, issue month, and the serial. The library does not extract sex.

**Caveats:** The field layout comes from a single 2023 Landinfo note, which cites the Norwegian and Danish ID centres. Public sources confirm the 13-digit length but not the field breakdown.

Sources: https://www.ecoi.net/en/file/local/2094117/Temanotat-Afghanistan-Tazkera-pass-og-andre-ID-dokumenter-28062023.pdf, https://en.wikipedia.org/wiki/Afghan_identity_card

### Afghan Taxpayer Identification Number — `AF_TIN`

Issued by: Ministry of Finance (Afghanistan Revenue Department) · Holders: individuals and entities · Check digit: none known · Confidence: moderate

**Format:** 10 digits. Example: `1234567890`.

**Check digit:** None published. Ministry of Finance Guide 18 describes the TIN only as "a unique 10-digit number". The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** Not re-verified beyond the Ministry guide.

Sources: https://mof.gov.af/sites/default/files/2019-03/Guide%2018%20-%20Taxpayer%20Identification%20Number%20%28TIN%29-min.pdf

## Anguilla (AI)

### Anguilla Taxpayer Identification Number — `AI_TIN`

Issued by: Inland Revenue Department (IRD) · Holders: individuals and entities that register with the IRD · Check digit: one exists, algorithm unpublished · Confidence: moderate

**Format:** 10 digits, system-generated. Example: `1234567890`.

| Part | Meaning |
|---|---|
| First digit | Prefix: `1` individual, `2` business/non-individual (per the OECD TIN sheet) |
| Middle digits | Serial |
| Last digit | Check digit |

TINs are not issued automatically. A person registers with the IRD when they get a business licence or a driver's licence, apply for a certificate of good standing, and so on. The same TIN is used for every tax type. It replaced the older Customer Identification and Enterprise numbers.

**Check digit:** According to the OECD sheet the last digit is a check digit, but the algorithm is not published. The library checks only length and pattern.

**What the library extracts:** the full number as the serial, and the holder kind (`extra.kind`: `individual` for prefix `1`, `business` for prefix `2`).

**Caveats:** Any other first digit is rejected as `invalid_format`. The check digit itself is not verified.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Anguilla-TIN.pdf

## Albania (AL)

### Albanian Personal Number — `AL_NID`

Issued by: General Directorate of Civil Status · Holders: Albanian citizens and foreigners with permanent residence · Check digit: letter, algorithm unpublished · Confidence: moderate

**Format:** 10 characters, `Y y MM DD SSS C`. Example: `I05101999Q`.

| Part | Meaning |
|---|---|
| `Y` | Decade of birth: `0`–`9` = 1800s–1890s, `A`–`J` = 1900s–1990s, `K`–`T` = 2000s–2090s |
| `y` | Year within the decade |
| `MM` | Month of birth; women add 50 (51–62) |
| `DD` | Day of birth |
| `SSS` | Issuing order among people with the same date |
| `C` | Check letter, `A`–`W` |

The NID is also the personal tax number, the social-security number, the voter-register number and the driving-licence number. The tax administration's specimen `I05101999Q` belongs to a woman born on 1 January 1980: `I` = 1980s, `0` = 1980, `51` = January for a woman, `01` = day.

**Check digit:** The tax administration says the letter is "calculated according to a formula that depends on the first 9 characters", but does not publish the formula. The library checks the pattern and the date, and rejects future dates.

**What the library extracts:** date of birth, age, gender, serial.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Albania-TIN.pdf, https://www.tatime.gov.al/eng/c/3/12/21/individual, https://en.wikipedia.org/wiki/Albanian_identity_card

### Albanian Taxpayer Identification Number — `AL_NIPT`

Issued by: National Business Center (QKB); for non-profits, tax representatives and farmers, the regional tax directorate · Holders: legal entities and people running an economic activity · Check digit: letter, algorithm unpublished · Confidence: moderate

**Format:** 10 characters, `L y MM DD SSS C`. Example: `K12113002H`.

| Part | Meaning |
|---|---|
| `L` | Decade of issue: `J` 1990s, `K` 2000s, `L` 2010s, `M` 2020s |
| `y` | Year within the decade |
| `MM` | "Converted" month of issue, which depends on the district of first registration (e.g. January = 13 in Tirana, 25 in another district) |
| `DD` | Day of issue |
| `SSS` | Order of issue within that day and district |
| `C` | Check letter |

**Check digit:** The formula is not published. The library checks the pattern only: decade letter `J`–`M`, a day of 01–31, and any capital letter at the end. Because the month field is district-coded, it is not checked.

**What the library extracts:** issue year and serial (`SSS`).

**Caveats:** The OECD sheet's illustrative number `J12345678N` contains day 45, so it fails the library's day check. The library takes the sheet's field description as authoritative, not its placeholder.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Albania-TIN.pdf, https://www.tatime.gov.al/eng/c/4/103/business-lifecycle

## Armenia (AM)

### Armenian Public Services Number — `AM_PSN`

Issued by: Migration and Citizenship Service (Ministry of Internal Affairs) · Holders: citizens, resident foreigners, stateless persons, refugees · Check digit: none known · Confidence: moderate

**Format:** 10 digits. Example: `1234567890`.

The PSN, also called the social card number, is set up by the Law on Public Service Number and Government Decision 419-N of 5 April 2012.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** Legal-advice sites claim the number is generated from sex and date of birth plus extra digits, but no official source describes the digit positions, so the library extracts nothing. One source says a new population-register law will repeal the PSN law once it takes effect. This was not confirmed.

Sources: https://migration.mia.gov.am/en/acquiring-a-certificate-on-the-public-services-number-psn, https://www.arlis.am/

### Armenian Taxpayer Identification Number — `AM_TIN`

Issued by: State Register (State Revenue Committee); the Central Bank for commercial banks · Holders: individuals and entities · Check digit: yes, algorithm unpublished · Confidence: moderate

**Format:** 8 digits, a 7-digit serial followed by a check digit. Example: `12345678`.

| Part | Meaning |
|---|---|
| Digits 1–7 | Next serial number; "no meaning is given to the numbers" |
| Digit 8 | Check digit, "calculated based on the previous 7 digits" |

A TIN is unique, never changes, and is never reissued after the holder is liquidated.

**Check digit:** The State Revenue Committee confirms a check digit exists but does not publish the algorithm. The library checks only length and pattern.

**What the library extracts:** the 7-digit serial.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Armenia-TIN.pdf, https://www.src.am/en/taxpayerSearchSystemPage/112

## Angola (AO)

### Angolan Identity Card Number — `AO_BI`

Issued by: Ministry of Justice and Human Rights (civil identification services) · Holders: Angolan citizens · Check digit: none known · Confidence: low

**Format:** 14 characters, 9 digits + 2 letters + 3 digits. Example: `123456789LA012`.

| Part | Meaning |
|---|---|
| 9 digits | Serial |
| 2 letters | Widely understood to be the province of issue (`LA` = Luanda); no official table found |
| 3 digits | Not documented |

Under Decreto Presidencial 245/21, a citizen's NIF is their Bilhete de Identidade number. The Angolan press reports this has been so since October 2018, so the same number is used for tax.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** the 9-digit serial and the raw two-letter code. The library does not map the letters to a province because no official table was found.

**Caveats:** The 9-2-3 format comes from one secondary source that took it from tax-authority (AGT) material, and no official description was found. The library does not cover company and foreigner NIFs, which have no published format.

Sources: https://lookuptax.com/docs/tax-identification-number/angola-tax-id-guide, https://lookuptax.com/validate/angola/nif, https://expansao.co.ao/angola/detalhe/apenas-2-em-cada-10-cidadaos-tem-oficialmente-numero-de-identificacao-fiscal-61658.html

## Argentina (AR)

### Argentine National Identity Document — `AR_DNI`

Issued by: RENAPER (Registro Nacional de las Personas) · Holders: citizens and resident foreigners · Check digit: none known · Confidence: moderate

**Format:** 7 or 8 digits, usually written with dots (`30.123.456`). Example: `30123456`.

DNIs are issued sequentially and carry no data. Since 2023, numbers from 70,000,000 up go to newborns, and the 60-million block was used for foreigners' CUIT/CUIL in 2019.

**Check digit:** None. The library checks only length and pattern: no leading zero, 7–8 digits. It accepts 7-digit DNIs (holders numbered below 10,000,000), which one upstream library rejects.

**What the library extracts:** the number as the serial.

Sources: https://www.argentina.gob.ar/dni, https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)

### Argentine Tax Identification Code — `AR_CUIT`

Issued by: ARCA (formerly AFIP) · Holders: individuals and legal entities · Check digit: mod 11 · Confidence: high

**Format:** 11 digits, `PP-NNNNNNNN-V`. Example: `20-12345678-6`.

| Part | Meaning |
|---|---|
| `PP` | Type prefix: 20, 23, 24, 27 for people (25, 26 also accepted); 30, 33, 34 for legal entities |
| `NNNNNNNN` | For people, the DNI zero-padded to 8 digits; for entities, a serial |
| `V` | Check digit |

Since Resolución General Conjunta 5007/2021, the person prefix is assigned at random and no longer indicates sex.

**Check digit:** Multiply the first 10 digits by 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 and add the products. Then V = 11 − (sum mod 11). If V comes out as 11, V = 0. A result of 10 is never issued; ARCA changes the prefix (usually to 23 or 33) and recalculates. Example: 2·5 + 0·4 + 1·3 + 2·2 + 3·7 + 4·6 + 5·5 + 6·4 + 7·3 + 8·2 = 148; 148 mod 11 = 5; 11 − 5 = 6, giving `20-12345678-6`.

**What the library extracts:** prefix, whether the holder is a person or an entity, the 8-digit body, and the embedded DNI for people. Bodies of all zeros are rejected.

**Caveats:** Prefixes 25 and 26 are accepted because an upstream library accepts them, but no ARCA source was found for them.

Sources: https://www.arca.gob.ar/, https://www.boletinoficial.gob.ar/detalleAviso/primera/245517/20210610, https://www.argentina.gob.ar/servicio/obtener-el-cuit

### Argentine Labour Identification Code — `AR_CUIL`

Issued by: ANSES · Holders: workers and benefit recipients · Check digit: mod 11 · Confidence: high

**Format:** 11 digits, `PP-NNNNNNNN-V`, with the same layout and check digit as the CUIT. Only the person prefixes 20, 23, 24, 27 are valid. Example: `20-12345678-6`.

**Check digit:** Same as `AR_CUIT`: weights 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, then V = 11 − (sum mod 11), with 11 → 0. A person's CUIL and CUIT are normally the same number.

**What the library extracts:** prefix, the 8-digit body, and the embedded DNI. The library never infers gender from the prefix, because it has been random since 2021.

Sources: https://www.anses.gob.ar/consulta/constancia-de-cuil, https://www.boletinoficial.gob.ar/detalleAviso/primera/245517/20210610

### Argentine Identification Key — `AR_CDI`

Issued by: ARCA · Holders: people who need a tax key but have no CUIT/CUIL · Check digit: mod 11 · Confidence: moderate · Deprecated

**Format:** 11 digits, with the same layout and check digit as the CUIL (prefixes 20, 23, 24, 27). Example: `27-12345678-0`.

**Check digit:** Same as `AR_CUIT`.

**What the library extracts:** prefix, the body, and the embedded DNI.

**Caveats:** ARCA RG 5803/2025 replaced the CDI request with a digital CUIT, so new CDIs are not issued. An upstream library accepts only prefix 50 for CDIs. The library follows RG 5007/2021 instead, which gives CDIs the person prefixes.

Sources: https://www.argentina.gob.ar/servicio/obtener-la-clave-de-identificacion-cdi, https://www.boletinoficial.gob.ar/detalleAviso/primera/245517/20210610, https://www.argentina.gob.ar/normativa/nacional/421823/texto

### Argentine Passport Number — `AR_PASAPORTE`

Issued by: RENAPER · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 8–9 letters/digits (commonly 3 letters + 6 digits). Example: `AAA123456`.

**Check digit:** None on the printed number. The machine-readable zone has its own ICAO check digits, but the library does not read them. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** Not re-verified.

Sources: https://www.argentina.gob.ar/interior/pasaporte, https://en.wikipedia.org/wiki/Argentine_passport

## Austria (AT)

### Austrian Social Insurance Number — `AT_SVNR`

Issued by: Dachverband der Sozialversicherungsträger · Holders: everyone insured in Austria · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 10 digits, `LLLC DDMMYY`. Example: `1237 010180`.

| Part | Meaning |
|---|---|
| `LLL` | Serial, 100–999 |
| `C` | Check digit |
| `DDMMYY` | Usually the date of birth; century not encoded |

If the birth date cannot be documented, the insurer uses 1 January or 1 July of the year. When those are used up, it uses days above 31 and months above 12. An impossible date is therefore not an error.

**Check digit:** Multiply the digits L1 L2 L3 D D M M Y Y by 3, 7, 9, 5, 8, 4, 2, 1, 6 (the check position is skipped) and add the products. C = sum mod 11. A remainder of 10 is never issued; the serial is changed instead. Example: 1·3 + 2·7 + 3·9 + 0·5 + 1·8 + 0·4 + 1·2 + 8·1 + 0·6 = 62; 62 mod 11 = 7, which matches the fourth digit.

**What the library extracts:** date of birth and age when the date is real (century = latest past one), the serial, and a `substituteDate` flag when the date is not a real date.

Sources: https://www.sozialversicherung.at/, https://de.wikipedia.org/wiki/Sozialversicherungsnummer#Österreich

### Austrian Tax Number — `AT_STEUERNUMMER`

Issued by: local tax office (Finanzamt), Federal Ministry of Finance · Holders: individuals liable to tax, and entities · Check digit: Luhn (as implemented) · Confidence: moderate

**Format:** 9 digits, `99-999/9999`. Example: `12-345/6782`.

| Part | Meaning |
|---|---|
| `FF` | Tax-office code (for Vienna, the district) |
| next 6 digits | Taxpayer number at that office |
| last digit | Check digit |

The number is not printed on ID documents; it appears on tax assessments. Because it is tied to the tax office, it can change when the taxpayer moves.

**Check digit:** The library applies Luhn to all 9 digits: double every second digit from the right, subtract 9 from results above 9, and the total must be divisible by 10. `123456782` gives 40.

**What the library extracts:** the tax-office code (as the region) and the taxpayer number.

**Caveats:** The OECD sheet confirms the 9-digit `99-999/9999` layout but does not mention a check digit, and no BMF document stating the Luhn rule was found. The rule comes from upstream libraries.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/austria-tin.pdf, https://www.bmf.gv.at/

### Austrian VAT Identification Number — `AT_UID`

Issued by: Federal Ministry of Finance (tax office) · Holders: businesses · Check digit: modified Luhn · Confidence: high

**Format:** `ATU` + 8 digits. Example: `ATU10223006` (BMF sample).

**Check digit:** BMF rule, with C1 = `U` and C2…C9 = the 8 digits:
1. For C3, C5 and C7 compute S = INT(C/5) + (2·C mod 10), which is the Luhn digit-sum of 2·C. Let R be their sum.
2. C9 = (10 − (R + C2 + C4 + C6 + C8 + 4) mod 10) mod 10.

For `U10223006`: R = 0 + 4 + 0 = 4; then 4 + (1 + 2 + 3 + 0) + 4 = 14; (10 − 4) mod 10 = 6, which matches.

**What the library extracts:** nothing beyond validity. `U12345678` and `AT12345678` are normalised to `ATU…`.

Sources: https://www.bmf.gv.at/dam/jcr:9f9f8d5f-5496-4886-aa4f-81a4e39ba83e/BMF_UID_Konstruktionsregeln.pdf, https://bmf.gv.at/dam/jcr:d6794f8f-d321-43df-9840-1a841f9bf5dc/BMF_UID_Konstruktionsregeln_Stand_November%202020.pdf, https://ec.europa.eu/taxation_customs/vies/

## Australia (AU)

Australia has no national identity number. The library covers the tax, business, health and driver-licence numbers below.

### Australian Tax File Number — `AU_TFN`

Issued by: Australian Taxation Office (ATO) · Holders: individuals and entities, on application · Check digit: weighted mod 11 · Confidence: high

**Format:** 9 digits, shown as `XXX XXX XXX`. Example: `123 456 782`.

**Check digit:** Multiply the digits by 1, 4, 3, 7, 5, 8, 6, 9, 10. The sum must be divisible by 11. For `123456782`: 1 + 8 + 9 + 28 + 25 + 48 + 42 + 72 + 20 = 253 = 11 × 23.

**What the library extracts:** nothing beyond validity.

**Caveats:** The ATO says older TFNs have 8 digits but does not publish their weights, so the library rejects 8-digit TFNs rather than guessing. One upstream library pads them with a 0, which no source supports.

Sources: https://www.ato.gov.au/individuals-and-families/tax-file-number, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/australia-tin.pdf, https://en.wikipedia.org/wiki/Tax_file_number

### Australian Business Number — `AU_ABN`

Issued by: Australian Business Register (ATO) · Holders: businesses and other entities · Check digit: mod 89 (two leading digits) · Confidence: high

**Format:** 11 digits, `XX XXX XXX XXX`: two leading check digits followed by a 9-digit identifier. For companies, the 9 digits are the ACN or ARBN. Example: `51 824 753 556`.

**Check digit:** Subtract 1 from the first digit. Multiply the 11 digits by 10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19. The sum must be divisible by 89. For `51824753556`, the adjusted digits give 534 = 89 × 6.

**What the library extracts:** nothing beyond validity.

Sources: https://abr.business.gov.au/Help/AbnFormat, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/australia-tin.pdf

### Australian Company Number — `AU_ACN`

Issued by: Australian Securities and Investments Commission (ASIC) · Holders: companies (ARBN for registered bodies) · Check digit: weighted mod 10 · Confidence: high

**Format:** 9 digits, `XXX XXX XXX`. Example: `000 250 000`.

**Check digit:** Multiply the first 8 digits by 8, 7, 6, 5, 4, 3, 2, 1 and add the products. Check = (10 − sum mod 10) mod 10. For `00025000`: 2·5 + 5·4 = 30, so the check digit is 0.

**What the library extracts:** nothing beyond validity.

Sources: https://asic.gov.au/for-business/registering-a-company/steps-to-register-a-company/australian-company-numbers/australian-company-number-digit-check/

### Australian Medicare Card Number — `AU_MEDICARE`

Issued by: Services Australia · Holders: people enrolled in Medicare · Check digit: weighted mod 10 (9th digit) · Confidence: moderate

**Format:** 10 digits, optionally followed by an 11th, `NNNN NNNNC I [R]`. Example: `2123 45670 1 1`.

| Part | Meaning |
|---|---|
| Digits 1–8 | Card identifier; the first digit is 2–6 |
| Digit 9 | Check digit |
| Digit 10 | Card issue number |
| Digit 11 | Individual Reference Number (IRN, the person's line on the card), often written after the number |

**Check digit:** Multiply digits 1–8 by 1, 3, 7, 9, 1, 3, 7, 9. Digit 9 = sum mod 10. For `21234567`: 2 + 3 + 14 + 27 + 4 + 15 + 42 + 63 = 170, so the check digit is 0.

**What the library extracts:** the 8-digit identifier, the issue number, and the IRN if present.

**Caveats:** Services Australia does not publish the algorithm, which comes from developer sources. Services Australia's operational guidance says IRNs run 1–9 and issue numbers cycle 1–9 (after 9 the issue number wraps back to 1), so the library rejects 0 in either position as `invalid_format`.

Sources: https://www.servicesaustralia.gov.au/medicare-card, https://stackoverflow.com/questions/3589345/how-do-i-validate-an-australian-medicare-number, https://operational.servicesaustralia.gov.au/public/Pages/your-health/011-44150000-01.html

### Australian Driver Licence Number — `AU_DL`

Issued by: each state and territory's road authority · Holders: licensed drivers · Check digit: none known · Confidence: low

**Format:** 8–10 digits (most states), or one letter + 5 digits (SA, TAS). Example: `1234567890`.

**Check digit:** None. The library checks only length and pattern. It does not reject numbers whose last five digits repeat; one upstream library does, but that is a data-loss-prevention heuristic, not an issuer rule.

**What the library extracts:** nothing beyond validity.

**Caveats:** Formats vary by state and change over time. Not re-verified.

Sources: https://learn.microsoft.com/en-us/purview/sit-defn-australia-drivers-license-number

## Aruba (AW)

### Aruban Identity Number — `AW_ID`

Issued by: Burgerlijke Stand en Bevolkingsregister (civil registry) · Holders: registered residents · Check digit: none known · Confidence: low

**Format:** 10 digits, `YYYY.MM.DD.NN`. Example: `1990.01.01.12`.

| Part | Meaning |
|---|---|
| `YYYY.MM.DD` | Date of birth |
| `NN` | Sequence number |

**Check digit:** None published. The library checks the pattern and that the birth date is real and not in the future.

**What the library extracts:** date of birth, age, serial.

**Caveats:** The only source is the government's guidance for the employer personnel register. Its text says "eight digits (year/month/day/number)", but its example `1965.12.12.40` has ten digits. The library follows the example. Nothing about sex or a check digit is published. Not re-verified online.

Sources: https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/toelichting-personeelsregister-2022-2023-def1.0.pdf

### Aruban Tax Identification Number — `AW_PERSOONSNUMMER`

Issued by: Departamento di Impuesto (DIMP) · Holders: individuals and entities that request one · Check digit: none known · Confidence: low

**Format:** 7 or 8 digits, system-generated. Example: `12345678`.

A person or entity gets a persoonsnummer on request after registering their details with the tax department, and the same number is used for every tax. It appears on tax returns, assessments and notices.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** the number as the serial.

**Caveats:** The OECD TIN sheet (2017) says 8 digits, while the government's 2022 personnel-register guidance says 7. The library accepts both.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Aruba-TIN.pdf, https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/toelichting-personeelsregister-2022-2023-def1.0.pdf, https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/toelichting-personeelsbehoefte-projecten-formulier-def1.0-1.pdf

## Azerbaijan (AZ)

### Azerbaijani Personal Identification Number — `AZ_FIN`

Issued by: Ministry of Internal Affairs (on ID cards and passports) · Holders: citizens and other ID-card holders · Check digit: none known · Confidence: moderate

**Format:** 7 letters and digits. Example: `5VBK5VR` (State Tax Service sample).

The FİN never changes. On new ID cards and passports it is printed as "Personal No". On older documents it sits in the machine-readable zone. The letter `O` is never used, only the digit `0`. Where an individual has no tax number, the FİN serves as the functional equivalent.

**Check digit:** None. The number encodes nothing. The library checks only the pattern: 7 characters from 0–9 and A–Z without O.

**What the library extracts:** nothing beyond validity.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Azerbaijan-TIN.pdf, https://washington.mfa.gov.az/en/category/passport/ferdi-indentifikasiya-nomresi-fin

### Azerbaijani Taxpayer Identification Number — `AZ_VOEN`

Issued by: State Tax Service under the Ministry of Economy · Holders: entities, and individuals engaged in business · Check digit: yes (9th digit), algorithm unpublished · Confidence: moderate

**Format:** 10 digits. Example: `1525855852` (individual), `1325678851` (legal person), both State Tax Service samples.

| Part | Meaning |
|---|---|
| Digits 1–2 | Territorial administrative unit |
| Digits 3–8 | Serial |
| Digit 9 | Computed by an unpublished algorithm |
| Digit 10 | `1` legal person, `2` natural person |

**Check digit:** The 9th digit is computed "via special algorithm", which is not published. The library checks the pattern only, including that the last digit is 1 or 2.

**What the library extracts:** the territorial code (as the region), the serial, and the holder type.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Azerbaijan-TIN.pdf, https://www.e-taxes.gov.az/ebyn/payerOrVoenChecker.jsp

## Bosnia and Herzegovina (BA)

### Bosnia and Herzegovina Unique Master Citizen Number — `BA_JMBG`

Issued by: civil registry, Agency for Identification Documents (IDDEEA) · Holders: citizens and registered foreigners · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `DDMMYYY RR BBB K`. Example: `0101990170003`.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth; `YYY` is the last three digits of the year (9xx → 19xx, 0xx → 20xx, 8xx → 18xx) |
| `RR` | Political region of first registration. BiH uses 10–19 (10 Banja Luka … 17 Sarajevo … 19 Zenica); 01 = foreigner in BiH |
| `BBB` | 000–499 male, 500–999 female |
| `K` | Check digit |

This is the shared former-Yugoslav JMBG. People who moved between republics before 1991 kept their numbers, so BiH holders can carry other republics' codes.

**Check digit:** Multiply the first 12 digits by 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 and take r = sum mod 11. If r = 0, K = 0; if r = 1, K = 0; otherwise K = 11 − r. Example: `010199017000` gives sum 96; 96 mod 11 = 8; K = 3.

**What the library extracts:** date of birth, age, gender, region code and name, serial, register area, and `citizenship: foreigner` for codes 01–08. Unallocated codes (20, 40, 90, 97–99) and future birth dates are rejected.

**Caveats:** Not re-verified online for this pass. The region table follows the 1978 SFRY allocation as listed on Wikipedia.

Sources: https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number, https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345

## Barbados (BB)

### Barbados Taxpayer Identification Number — `BB_TIN`

Issued by: Barbados Revenue Authority (BRA) · Holders: individuals and companies required to file returns · Check digit: none · Confidence: moderate

**Format:** 13 digits, always starting with `1`, with no letters, slashes or dashes. Example: `1234567890123`.

The number is randomly generated by the BRA system. TINs are not issued automatically; a person or company registers when Section 52 of the Income Tax Act requires them to file. The TIN appears on tax returns, tax clearance certificates and registration confirmation letters.

**Check digit:** None. The number is random and encodes nothing. The library checks only length, pattern and the leading `1`.

**What the library extracts:** nothing beyond validity.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/barbados-tin.pdf

## Bangladesh (BD)

### Bangladesh National ID Number (13/17-digit) — `BD_NID`

Issued by: Bangladesh Election Commission (NID Wing) · Holders: citizens on the voter list · Check digit: none known · Confidence: low

**Format:** 13 digits (2008 voter registration), or 17 digits (later updates: birth year + the 13-digit structure). Example: `1984 15 9 28 24 588424`.

| Part | Meaning |
|---|---|
| `YYYY` (17-digit form only) | Birth year |
| `DD` | District code |
| `R` | Area type: 1 rural, 2 municipality, 3 city, 4 other, 5 cantonment, 9 city corporation |
| `PP` | Police station (thana) |
| `UU` | Union / ward |
| `SSSSSS` | Serial |

The Election Commission reports that about 80 million voters got 13-digit numbers in 2008 and more than 15 million later got 17-digit numbers. All lengths remain valid.

**Check digit:** None published. The library checks the pattern, including the area-type digit, and rejects birth years before 1870 or after the reference date.

**What the library extracts:** birth year (17-digit form), district code, area type, police station, union/ward, serial.

**Caveats:** The field layout comes from an upstream library and secondary sources. No official breakdown was found online.

Sources: https://services.nidw.gov.bd/, https://en.wikipedia.org/wiki/National_identity_card_(Bangladesh), https://www.gov.uk/government/publications/bangladesh-country-policy-and-information-notes/country-information-note-documentation-bangladesh-november-2024-accessible, https://bdnews24.com/bangladesh/election-commission-decides-on-10-digit-smart-nid-cards-for-bangladesh-nationals

### Bangladesh Smart Card NID Number — `BD_SMART_NID`

Issued by: Bangladesh Election Commission · Holders: citizens with a smart NID card (from 2016) · Check digit: one exists, algorithm unpublished · Confidence: low

**Format:** 10 digits. Example: `1234567890`.

According to the Election Commission's design, as reported by bdnews24, nine digits are random and the tenth is a checksum. The first digit is never 0, and no digit appears four or more times.

**Check digit:** The algorithm is not published. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** The leading-digit and repetition rules are from a press report of the Election Commission's proposal. The library does not enforce them.

Sources: https://bdnews24.com/bangladesh/election-commission-decides-on-10-digit-smart-nid-cards-for-bangladesh-nationals, https://services.nidw.gov.bd/

## Belgium (BE)

### Belgian National Register Number — `BE_NRN`

Issued by: Rijksregister / Registre national (FPS Home Affairs) · Holders: people registered in Belgium (citizens and resident foreigners) · Check digit: mod 97 · Confidence: high

**Format:** 11 digits, `YY.MM.DD-SSS.CC`. Example: `85.07.30-033.28`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth; month and/or day may be 00 when unknown |
| `SSS` | Counter 001–997: odd for men, even for women |
| `CC` | Check digits |

**Check digit:** CC = 97 − (first 9 digits mod 97). For people born from 2000 onwards, prefix a `2` to the 9 digits first. The check digits therefore reveal the century. Example: 850730033 mod 97 = 69; 97 − 69 = 28. That matches, so the holder was born on 30 July 1985, and counter 033 (odd) means male.

**What the library extracts:** date of birth (or just the year when month/day is 00), age, gender, serial.

Sources: https://www.ibz.rrn.fgov.be/fileadmin/user_upload/fr/rn/instructions/liste-TI/TI000_Numerodidentification.pdf, https://www.ksz-bcss.fgov.be/fr/services-et-support/services/registres-bcss, https://en.wikipedia.org/wiki/National_identification_number#Belgium

### Belgian BIS Number — `BE_BIS`

Issued by: Crossroads Bank for Social Security (KSZ/BCSS) · Holders: people not in the National Register who deal with Belgian social security (e.g. non-resident foreign workers) · Check digit: mod 97 · Confidence: high

**Format:** 11 digits, with the same layout as the national register number. The month is increased by 20 (21–32) if the sex was unknown at registration, or by 40 (41–52) if it was known. Example: `85.47.30-033.17`.

**Check digit:** Same as `BE_NRN`. Example: 854730033 mod 97 = 80; 97 − 80 = 17.

**What the library extracts:** date of birth, age, serial, `citizenship: foreigner`, and gender only when the month offset is 40, with `sexKnown` in `extra`. For a BIS number the INSZ/NISS social-security number is the BIS number itself.

Sources: https://www.ksz-bcss.fgov.be/fr/services-et-support/services/registres-bcss, https://banquecarrefour.fgov.be/sites/default/files/assets/diensten_en_support/documentatie/tss_registries_concepts_nl.docx

### Belgian Enterprise / VAT Number — `BE_BTW`

Issued by: Crossroads Bank for Enterprises (KBO/BCE) · Holders: enterprises · Check digit: mod 97 · Confidence: high

**Format:** `BE` + 10 digits, starting with 0 or 1 (1 allowed since 1 January 2020). Example: `BE 0403.170.701`.

**Check digit:** The last two digits = 97 − (first 8 digits mod 97). BMF sample: `0776091951`: 07760919 mod 97 = 46; 97 − 46 = 51. Old 9-digit numbers are normalised by adding a leading 0.

**What the library extracts:** nothing beyond validity.

Sources: https://economie.fgov.be/en/themes/enterprises/crossroads-bank-enterprises/registration-crossroads-bank, https://ec.europa.eu/taxation_customs/vies/, https://bmf.gv.at/dam/jcr:d6794f8f-d321-43df-9840-1a841f9bf5dc/BMF_UID_Konstruktionsregeln_Stand_November%202020.pdf

## Bulgaria (BG)

### Bulgarian Uniform Civil Number — `BG_EGN`

Issued by: GRAO (civil registration directorate, Ministry of Regional Development) · Holders: Bulgarian citizens and some permanent residents · Check digit: weighted mod 11 · Confidence: high

**Format:** 10 digits, `YYMMDD RRR C`. Example: `800101 624 3`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth. The month gets +20 for births 1800–1899 and +40 for births 2000–2099 |
| `RRR` | Birth-region range (historical allocation by oblast, 000–925; 926–999 other/unknown). The last digit is even for men, odd for women |
| `C` | Check digit |

**Check digit:** Multiply the first 9 digits by 2, 4, 8, 5, 10, 9, 7, 3, 6 and take sum mod 11. A remainder of 10 becomes 0. Example: `800101624` gives 102; 102 mod 11 = 3. So the holder was born on 1 January 1980, the 9th digit 4 is even (male), and 624 falls in the Sofia (city) block.

**What the library extracts:** date of birth, age, gender, region code and name. Future dates are rejected. One upstream library mishandles the remainder-10 case.

Sources: https://www.grao.bg/, https://bg.wikipedia.org/wiki/%D0%95%D0%B4%D0%B8%D0%BD%D0%B5%D0%BD_%D0%B3%D1%80%D0%B0%D0%B6%D0%B4%D0%B0%D0%BD%D1%81%D0%BA%D0%B8_%D0%BD%D0%BE%D0%BC%D0%B5%D1%80, https://en.wikipedia.org/wiki/National_identification_number#Bulgaria

### Bulgarian Personal Number of a Foreigner — `BG_LNCH`

Issued by: Ministry of Interior (migration directorate) · Holders: foreigners residing in Bulgaria · Check digit: weighted mod 10 · Confidence: low

**Format:** 10 digits, no encoded data. Example: `1001000004`.

**Check digit:** Multiply the first 9 digits by 21, 19, 17, 13, 11, 9, 7, 3, 1. The check digit is sum mod 10. Example: 1·21 + 1·13 = 34, so the check digit is 4.

**What the library extracts:** `citizenship: foreigner`.

**Caveats:** The issuer does not publish the algorithm, which comes from independent validators. It does reproduce their published valid/invalid examples.

Sources: https://kik-info.com/spravochnik/proverka-na-egn.php, https://www.mvr.bg/

### Bulgarian VAT Number — `BG_VAT`

Issued by: National Revenue Agency (NRA); the ЕИК/БУЛСТАТ comes from the Registry Agency · Holders: legal entities (9 digits) and VAT-registered individuals (10 digits) · Check digit: mod 11 (entity) or EGN/LNCh rules · Confidence: high

**Format:** `BG` + 9 or 10 digits. The prefix is optional. Example: `BG123456786`.

| Form | Meaning |
|---|---|
| 9 digits | The entity's ЕИК/БУЛСТАТ (UIC) |
| 10 digits | A natural person's ЕГН or ЛНЧ |

**Check digit:**
- **9 digits:** r = Σ digit·(1…8) mod 11. If r = 10, recompute with weights 3…10; if it is still 10, use 0. Example: `12345678` → 204 mod 11 = 6.
- **10 digits:** the number must be a valid ЕГН or ЛНЧ, checked as above.

**What the library extracts:** which kind of number it is (`uic`, `egn`, `lnch`).

**Caveats:** The 13-digit ЕИК for branches is not covered. The only rule found comes from an upstream library and is unsupported.

Sources: https://nra.bg/, https://ec.europa.eu/taxation_customs/vies/, https://en.wikipedia.org/wiki/VAT_identification_number

## Bahrain (BH)

### Bahraini Personal Number — `BH_CPR`

Issued by: Information & eGovernment Authority (iGA), Central Population Register · Holders: citizens and residents · Check digit: one exists, algorithm unpublished · Confidence: moderate

**Format:** 9 digits, `YYMM SSSS C`. Example: `8001 0100 1`.

| Part | Meaning |
|---|---|
| `YY` | Year of birth; century not encoded |
| `MM` | Month of birth |
| `SSSS` | Serial |
| `C` | Check digit |

**Check digit:** The iGA does not publish the algorithm. The library checks the pattern and that the year and month are not in the future. The century is taken as the latest one that puts the month in the past.

**What the library extracts:** birth year, birth month, serial.

**Caveats:** Secondary guides say parents can pay for a custom personal number for a newborn. Forum reports describe CPRs whose first digits do not match the birth year. Such numbers break the `YYMM` reading and may fail the library's month check.

Sources: https://www.iga.gov.bh/, https://en.wikipedia.org/wiki/National_identification_number#Bahrain, https://blog.wego.com/bahrain-cpr-number/

## Benin (BJ)

### Beninese Single Tax Identifier — `BJ_IFU`

Issued by: Direction Générale des Impôts (DGI) · Holders: individuals and entities · Check digit: one exists, algorithm unpublished · Confidence: moderate

**Format:** 13 digits, `T YYYY NNNNNN E K`. Example: `3 2009 013535 1 0`.

| Part | Meaning |
|---|---|
| `T` | Taxpayer type: 1 individual (male), 2 individual (female), 3 company, 4 state body, 5 international organisation / diplomatic mission, 6 NGO |
| `YYYY` | Year of registration |
| `NNNNNN` | Sequence within that year |
| `E` | 1 parent company, 2–9 branch or agency, 0 other taxpayers |
| `K` | Check digit |

Décret 2006-201 sets the 13-digit length and calls the last digit the "chiffre clé".

**Check digit:** The DGI says the key is "créé par un algorithme" but does not publish it. The library checks the pattern and rejects registration years in the future.

**What the library extracts:** taxpayer type, gender (types 1 and 2), registration year, sequence, establishment role.

Sources: https://sgg.gouv.bj/doc/decret-2006-201/download, https://org-id.guide/list/BJ-IFU, https://impots.finances.gouv.bj/wp-content/uploads/2016/12/IFU.pdf

## Brunei (BN)

Brunei issues no TIN. Individuals are identified by their identity-card number and entities by their registration number.

### Brunei Identity Card Number — `BN_IC`

Issued by: Immigration and National Registration Department · Holders: citizens, permanent residents and temporary residents aged 12 and over · Check digit: none known · Confidence: high

**Format:** 8 digits, written `NN-NNNNNN`. Example: `01-123456`.

| Part | Meaning |
|---|---|
| `NN` | Status / card colour. From 2000: 01–29 citizen (yellow), 31–49 permanent resident (purple), 51–99 temporary resident (green). Before 2000: 00 citizen, 30 permanent resident, 50 temporary resident |
| `NNNNNN` | Serial. Pre-2000 prefixes use fixed blocks: 00 → 000001–080000, 110001–130000, 250001–650000; 30 → 080001–110000, 200001–250000; 50 → 130001–200000, 650001–999999 |

The prefix is not a birth year, despite claims on some commercial sites.

**Check digit:** None. The library checks the prefix and, for pre-2000 numbers, the serial block. A serial outside its block is rejected as out of range.

**What the library extracts:** residence status, card colour, whether the number was issued before 2000, serial.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/brunei-darussalam-tin%20.pdf

### Brunei Company / Business Name Registration Number — `BN_ROC`

Issued by: Registry of Companies and Business Names (Ministry of Finance and Economy) · Holders: businesses · Check digit: none · Confidence: high

**Format:** a fixed prefix followed by 8 digits. Example: `RC00000567`.

| Prefix | Meaning |
|---|---|
| `P` (9 characters) | Sole proprietorship or partnership, Business Names Act |
| `RC` (10 characters) | Private or public company, Companies Act |
| `RFC` (11 characters) | Foreign company branch, Companies Act |

The older form `RC/567/2012` became `RC00000567`.

**Check digit:** None. The library checks only the prefix and 8 digits.

**What the library extracts:** registration kind and the 8-digit serial.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/brunei-darussalam-tin%20.pdf, https://business.mofe.gov.bn/Shared%20Documents/BR%20Guideline%20and%20related%20docs/Business%20Reporting%20(BR)%20Briefing%20Pack%20(051218).pdf, https://www.mofe.gov.bn/wp-content/uploads/2025/12/Published-on-14th-August-2025-1.pdf

## Bolivia (BO)

### Bolivian Identity Card Number — `BO_CI`

Issued by: SEGIP (Servicio General de Identificación Personal, Ley 145/2011) · Holders: citizens and resident foreigners · Check digit: none known · Confidence: low

**Format:** 6–9 digits, optionally followed by the department of issue. Example: `1234567 LP`.

| Part | Meaning |
|---|---|
| Digits | Serial |
| Suffix (optional) | Department of issue ("expedido en"): LP La Paz, CB Cochabamba, SC Santa Cruz, OR Oruro, PT Potosí, CH Chuquisaca, TJ Tarija, BE Beni, PA Pando |

**Check digit:** None. The library checks only the pattern.

**What the library extracts:** serial, plus department code and name when the suffix is present.

**Caveats:** Not re-verified online. Some CIs also carry an alphanumeric "complemento" for duplicates. The library does not model it.

Sources: https://www.segip.gob.bo/, https://bolivia.infoleyes.com/norma/3121/ley-del-servicio-general-de-identificaci%C3%B3n-personal-y-del-servicio-general-de-licencias-para-conducir-145

### Bolivian Tax Identification Number — `BO_NIT`

Issued by: Servicio de Impuestos Nacionales (SIN) · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 7–13 digits. Example: `1023456789012`.

**Check digit:** SIN publishes no check-digit rule. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** The module describes older NITs as 7–11 digits and natural-person NITs since 2021 as 13 digits derived from the CI. Secondary sources found online instead say a person's NIT is the CI digits plus three digits assigned by SIN, with length varying by CI. No official layout was found.

Sources: https://www.impuestos.gob.bo/, https://boliviaimpuestos.com/numero-de-identificacion-tributaria-nit/

### Bolivian Passport Number — `BO_PASAPORTE`

Issued by: Dirección General de Migración · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 6–9 letters/digits (Andean Community passport). Example: `AB1234567`.

**Check digit:** None on the printed number. The machine-readable zone has its own ICAO check digits, but the library does not read them. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

**Caveats:** Not re-verified.

Sources: https://www.migracion.gob.bo/, https://en.wikipedia.org/wiki/Bolivian_passport

## Brazil (BR)

### Brazilian Individual Taxpayer Registry (CPF) — `BR_CPF`

Issued by: Receita Federal do Brasil · Holders: individuals (citizens and foreigners with Brazilian tax obligations) · Check digit: two mod-11 digits · Confidence: high

**Format:** 11 digits, written `NNN.NNN.NNR-DD`. Example: `529.982.247-25`.

| Part | Meaning |
|---|---|
| `NNNNNNNN` | Sequential number |
| `R` | Fiscal region where the CPF was first registered: 0 RS (10th region), 1 DF/GO/MS/MT/TO, 2 AC/AM/AP/PA/RO/RR, 3 CE/MA/PI, 4 AL/PB/PE/RN, 5 BA/SE, 6 MG, 7 ES/RJ, 8 SP, 9 PR/SC |
| `DD` | Two check digits |

**Check digit:** First digit: multiply the 9 base digits by 10, 9, …, 2, sum, take the remainder mod 11; remainder 0 or 1 gives 0, otherwise 11 − remainder. Second digit: same over the 9 digits plus the first check digit with weights 11, 10, …, 2. Example `529982247`: sum 295, 295 mod 11 = 9 → 2; then `5299822472`: sum 347, mod 11 = 6 → 5. Result `…-25`.

**What the library extracts:** fiscal region digit and its states, 8-digit serial.

**Caveats:** The region digit reflects the address at first registration, not where the holder lives now. All-same-digit numbers (e.g. `111.111.111-11`) pass the checksum but are never issued; the library rejects them.

Sources: https://www.gov.br/receitafederal/pt-br/servicos/cpf, https://www.gov.br/receitafederal/pt-br/assuntos/educacao-fiscal/educacao_fiscal/folhetos-orientativos/cadastros-dig.pdf, https://en.wikipedia.org/wiki/CPF_number

### Brazilian National Registry of Legal Entities (CNPJ) — `BR_CNPJ`

Issued by: Receita Federal do Brasil · Holders: companies and other legal entities, per establishment · Check digit: two mod-11 digits · Confidence: high

**Format:** 14 characters, written `RR.RRR.RRR/BBBB-DD`. Example: `11.222.333/0001-81`.

| Part | Meaning |
|---|---|
| `RRRRRRRR` | Root, identifying the entity |
| `BBBB` | Establishment (branch) order; `0001` is the head office |
| `DD` | Two check digits |

**Check digit:** Each character is valued as its ASCII code − 48, so digits keep their value and A–Z become 17–42. First digit: weights 5,4,3,2,9,8,7,6,5,4,3,2 over the first 12 characters; remainder mod 11 of 0 or 1 gives 0, otherwise 11 − remainder. Second digit: weights 6,5,4,3,2,9,8,7,6,5,4,3,2 over the 12 characters plus the first check digit. Example `112223330001`: sum 102, mod 11 = 3 → 8; with the 8 appended: sum 120, mod 11 = 10 → 1. Result `…-81`. Receita's alphanumeric example `12ABC34501DE` gives check digits `35`.

**What the library extracts:** root, branch order, whether it is the head office, whether the number is alphanumeric.

**Caveats:** From July 2026 the first 12 characters of new CNPJs may contain letters (IN RFB 2.229/2024); existing numeric CNPJs stay valid. The check digits remain numeric.

Sources: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj, https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf, https://normasinternet2.receita.fazenda.gov.br/#/consulta/externa/141102

### Brazilian Social Integration Program Number (PIS/PASEP/NIT/NIS) — `BR_PIS`

Issued by: Caixa Econômica Federal (PIS), Banco do Brasil (PASEP), INSS (NIT) · Holders: workers and social-programme beneficiaries · Check digit: mod 11 · Confidence: high

**Format:** 11 digits, written `NNN.NNNNN.NN-C`. Example: `120.56412.54-5`. The first 10 digits are a serial; the 11th is the check digit. PIS, PASEP, NIT and NIS share one number space.

**Check digit:** Multiply the first 10 digits by 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 and sum. Remainder mod 11 of 0 or 1 gives 0, otherwise 11 − remainder. Example `1205641254`: sum 149, mod 11 = 6 → 5.

**What the library extracts:** validity only.

Sources: https://www.caixa.gov.br/beneficios-trabalhador/pis/Paginas/default.aspx, https://www.gov.br/esocial/pt-br/documentacao-tecnica

### Brazilian Voter Registration Number (Título de Eleitor) — `BR_TITULO_ELEITOR`

Issued by: Tribunal Superior Eleitoral (TSE) and regional electoral courts · Holders: registered voters · Check digit: two mod-11 digits · Confidence: moderate

**Format:** 12 digits, `SSSSSSSS UU DD`. Example: `0043 5687 09 06`.

| Part | Meaning |
|---|---|
| `SSSSSSSS` | Sequential number within the state |
| `UU` | TSE state code: 01 SP, 02 MG, 03 RJ, … 27 TO, 28 voters abroad |
| `DD` | Two check digits |

**Check digit:** First digit: weights 2–9 over the 8 sequence digits, remainder mod 11; remainder 10 gives 0. Second digit: weights 7, 8, 9 over the two UF digits and the first check digit, remainder mod 11; 10 gives 0. For SP (01) and MG (02) a remainder of 0 gives 1. Example: `00435687` → sum 230, mod 11 = 10 → 0; then `0`,`9`,`0` → 72, mod 11 = 6. Result `…09 06` (state SC).

**What the library extracts:** UF code and state, 8-digit serial.

**Caveats:** The algorithm is widely implemented but no TSE publication of the check rule (including the SP/MG exception) was found online; confidence stays moderate.

Sources: https://sintse.tse.jus.br/documentos/1998/Abr/22/diario-da-justica-secao-1/resolucao-no-20-132-de-19-de-marco-de-1998-dispoe-sobre-o-alistamento-e-servicos-eleitorais-mediante, https://www.tse.jus.br/legislacao/compilada/res/2003/resolucao-no-21-538-de-14-de-outubro-de-2003

### Brazilian Driver's Licence Register Number (CNH) — `BR_CNH`

Issued by: state DETRANs under SENATRAN/CONTRAN (RENACH) · Holders: licensed drivers · Check digit: two mod-11 digits · Confidence: moderate

**Format:** 11 digits, `NNNNNNNNN-DD`: 9-digit national register number and two check digits. Example: `026503064-61`.

**Check digit:** First digit: weights 9, 8, …, 1 over the 9 digits, r1 = sum mod 11; digit = r1, or 0 if r1 ≥ 10. Second digit: weights 1, 2, …, 9 over the same 9 digits; subtract 2 from the sum if r1 was ≥ 10; take mod 11, and 10 gives 0. Example `026503064`: sum 116, mod 11 = 6 → 6; second sum 144, mod 11 = 1 → 1. Result `…-61`.

**What the library extracts:** 9-digit serial.

**Caveats:** CONTRAN Resolution 886/2021 says the register number is 9 characters plus 2 check digits, but neither it nor any issuer page we found publishes the weights. The algorithm above is the one used in common validators.

Sources: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao_192_06.doc, https://www.legisweb.com.br/legislacao/?id=286555, https://www.legisweb.com.br/legislacao/?id=425117

### Brazilian General Registry (RG, São Paulo) — `BR_RG`

Issued by: state public-security secretariats (here SSP-SP) · Holders: residents of the issuing state · Check digit: mod 11 (SP scheme only) · Confidence: low

**Format:** 9 characters, `NN.NNN.NNN-C`, where C is 0–9 or X. Example: `12.345.678-2`.

**Check digit:** Multiply the 8 digits by 2, 3, 4, 5, 6, 7, 8, 9 (left to right) and sum. Check = (11 − sum mod 11) mod 11; 10 is written X. Example `12345678`: sum 240, mod 11 = 9 → 2.

**What the library extracts:** 8-digit serial and the scheme (`SSP-SP`).

**Caveats:** Each state runs its own RG numbering with its own length and check rule; only the São Paulo rule is implemented, so RGs from other states may fail. Brazil is replacing the RG with the CIN, which uses the CPF as its number.

Sources: https://en.wikipedia.org/wiki/Brazilian_identity_card

### Brazilian Passport Number — `BR_PASAPORTE`

Issued by: Polícia Federal · Holders: Brazilian citizens · Check digit: none known · Confidence: moderate

**Format:** 8 characters, 2 letters + 6 digits. Example: `FA123456`. No published internal structure; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity of shape.

Sources: https://www.gov.br/pf/pt-br/assuntos/passaporte, https://en.wikipedia.org/wiki/Brazilian_passport

## Bhutan (BT)

### Bhutanese Citizenship Identity Card Number (CID) — `BT_CID`

Issued by: Department of Civil Registration and Census (Ministry of Home Affairs) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 11 digits, `S DD GG NNNNNN`. Example: `1 14 10 012345`.

| Part | Meaning |
|---|---|
| `S` | Census category (1/2/3), tied to the census form used |
| `DD` | Dzongkhag (district) code, said to follow alphabetical order |
| `GG` | Gewog (sub-district) code within the dzongkhag |
| `NNNNNN` | Serial within the gewog |

**Check digit:** none known; the library checks only length and pattern.

**What the library extracts:** dzongkhag code (as region), gewog code, census category, serial — all raw, without name tables.

**Caveats:** The layout comes from two blogs, not an official specification. A tax-guide site reads the first digit as the dzongkhag instead, and survey codebooks number the dzongkhags differently, so the codes may not map to a stable list. The 2025 fourth-generation card may follow another scheme.

Sources: https://phubdorjiwang.blogspot.com/2019/03/interpretation-of-our-bhutanese.html, https://amrithdiary.blogspot.com/2016/03/what-does-your-cid-number-tell-about-you.html, https://tech.gov.bt/sites/default/files/data_standards.pdf

## Botswana (BW)

### Botswana National Identity Card Number (Omang) — `BW_OMANG`

Issued by: Department of National Registration (Ministry of Labour and Home Affairs) · Holders: citizens only · Check digit: none known · Confidence: low

**Format:** 9 digits; the 5th (middle) digit is 1 for men and 2 for women. Example: `1234 1 6789`.

| Part | Meaning |
|---|---|
| digits 1–4 | Not documented |
| digit 5 | Sex: 1 male, 2 female |
| digits 6–9 | Not documented |

The number is the citizen's unique identification number, assigned at birth registration and carried onto the Omang card at 16.

**Check digit:** none published; the library checks length and that digit 5 is 1 or 2.

**What the library extracts:** gender, citizenship (always citizen).

**Caveats:** The gender digit rests on one secondary source (an IRB Canada response citing the ministry and embassy). The gender digit reflects the registered sex and is not always updated.

Sources: https://www.refworld.org/docid/4f9e34252.html, https://id4d.worldbank.org/sites/id4d/files/2018-04/Botswana_ID4D_DiagnosticWeb040418.pdf, https://www.botswanaembassy.org/node/1767

## Belarus (BY)

### Belarusian Identification Number — `BY_ID`

Issued by: Ministry of Internal Affairs (MVD) · Holders: citizens and resident foreigners; printed in passports and the biometric ID card · Check digit: one, not verified by the library · Confidence: low

**Format:** 14 characters, `9999999B999BB9`. Example: `3010185A001PB1`. Two generations are valid.

| Part (pre-2012) | Meaning |
|---|---|
| `G` | Sex and century: 1/2 = 1800s, 3/4 = 1900s, 5/6 = 2000s; odd male, even female |
| `DDMMYY` | Date of birth |
| `R` | Issuing region: A Minsk city, B Minsk Region, C Brest, E Vitebsk, H Gomel, K Grodno, M Mogilev |
| `NNN` | Sequence among people born that day |
| `CC` | Citizenship status; `PB` = citizen of Belarus |
| `K` | Check digit |

Since 2012 (MVD Resolution 345 of 18 October 2011) new numbers are `7NNNNNN A NNN PB K`: a random 7xxxxxx block, letter A, a 3-digit sequence, `PB`, and a check digit; nothing about the holder is encoded. The example decodes as a man born 1 January 1985, Minsk.

**Check digit:** reportedly mod 10 with repeating weights 7, 3, 1 and letters A–Z = 10–35 (ICAO 9303 style). Not verified: the library checks the pattern only.

**What the library extracts:** for pre-2012 numbers: date of birth, age, gender, region, serial, citizenship code (citizen when `PB`); for 2012 numbers: serial and scheme.

**Caveats:** The pre-2012 layout is from press and forum material, not a readable issuer page. The illustrative numbers found don't satisfy the 7-3-1 rule, so the check digit is not enforced. Cyrillic look-alike letters are mapped to Latin on input.

Sources: https://340fzreport.nalog.ru/html/sites/www.340fzreport.nalog.ru/doc/sng_tin_23122020.pdf, https://mvd.gov.by/uploads/dgim/r345.pdf, https://forum.onliner.by/viewtopic.php?t=895870&start=160, https://gp.by/qa/vopros-otvet/vash-nomer-v-pasporte-.html

### Belarusian Taxpayer Account Number (УНП) — `BY_UNP`

Issued by: Ministry of Taxes and Duties · Holders: individuals, sole traders and legal entities · Check digit: reportedly one, not verified · Confidence: moderate

**Format:** 9 characters. Legal entities and sole traders: 9 digits. Individuals: 2 Latin capitals + 7 digits. Example: `123456789`.

**Check digit:** the last character is reportedly a check digit, but no official source for the algorithm was found; the library checks only length and pattern.

**What the library extracts:** holder type (entity/sole trader vs individual), from whether the number starts with a digit.

**Caveats:** Third-party validators compute a mod-11 check digit for the UNP; it is not implemented here for lack of an issuer source.

Sources: https://340fzreport.nalog.ru/html/sites/www.340fzreport.nalog.ru/doc/sng_tin_23122020.pdf, https://www.portal.nalog.gov.by/grp/

## Belize (BZ)

### Belize Tax Identification Number — `BZ_TIN`

Issued by: Belize Tax Service · Holders: employees, sole proprietors, partnerships, companies (on registration) · Check digit: one, algorithm unpublished · Confidence: moderate

**Format:** 6 digits, plus a 7th check digit that the taxpayer normally doesn't see. Example: `1234567`. Per the OECD TIN sheet, taxpayers registered through the Revenue Management System get a 6-digit TIN with a single check digit appended; the check digit "is not visible to the taxpayer", so people usually quote 6 digits.

**Check digit:** not published; the library accepts 6 or 7 digits and checks only the shape.

**What the library extracts:** the 6-digit serial and whether a check digit is present.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/belize-tin.pdf, https://bts.gov.bz/

## Canada (CA)

### Canadian Social Insurance Number — `CA_SIN`

Issued by: Service Canada (Employment and Social Development Canada) · Holders: citizens, permanent residents, temporary residents allowed to work · Check digit: Luhn · Confidence: high

**Format:** 9 digits, written `NNN NNN NNN`. Example: `123 456 782`.

| Part | Meaning |
|---|---|
| 1st digit | Region of registration: 1 Atlantic provinces, 2–3 Quebec, 4–5 Ontario, 6 Prairies/NWT/Nunavut, 7 BC/Yukon, 9 temporary residents |
| digits 2–8 | Serial |
| 9th digit | Luhn check digit |

**Check digit:** Luhn over all 9 digits: from the right, double every second digit, subtract 9 from any result over 9, add everything; the total must be divisible by 10. Example `123456782`: 1+4+3+8+5+(12−9)+7+(16−9)+2 = 40.

**What the library extracts:** region digit and name; for 9xx numbers, temporary-resident status.

**Caveats:** First digit 0 is used by the CRA for individual, temporary and adoption tax numbers and 8 for business numbers; neither is a SIN, so the library reports them as out of range. A 9xx SIN expires with the holder's permit.

Sources: https://www.canada.ca/en/employment-social-development/services/sin.html, https://en.wikipedia.org/wiki/Social_insurance_number

### Canadian Business Number — `CA_BN`

Issued by: Canada Revenue Agency · Holders: businesses and organisations · Check digit: none published · Confidence: low

**Format:** 9-digit root (BN9), optionally followed by a 2-letter program identifier and a 4-digit reference (BN15). Example: `123456789 RT0001`.

| Part | Meaning |
|---|---|
| `NNNNNNNNN` | Business Number root, unique per business |
| `XX` | Program account: RT GST/HST, RP payroll, RC corporate income tax, RM import/export, RR charity, RZ information returns |
| `NNNN` | Reference number of that program account |

**Check digit:** the CRA publishes none; the library checks only length and pattern.

**What the library extracts:** root, program identifier, reference number.

**Caveats:** Third-party validators apply Luhn to the 9-digit root; this is not enforced here because no CRA publication confirms it.

Sources: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account.html, https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html

### Canadian Passport Number — `CA_PASAPORTE`

Issued by: Immigration, Refugees and Citizenship Canada (Passport Program) · Holders: Canadian citizens · Check digit: none known · Confidence: moderate

**Format:** 8 characters, 2 letters + 6 digits. Example: `AB123456`. No published internal structure; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity of shape.

Sources: https://en.wikipedia.org/wiki/Canadian_passport, https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number

## Democratic Republic of the Congo (CD)

### Congolese Voter Card National Number — `CD_NN`

Issued by: Commission Électorale Nationale Indépendante (CENI) · Holders: registered voters · Check digit: none known · Confidence: low

**Format:** 11 digits, printed at the top right of the CENI voter card. Example: `12345678901`. The DRC has no issued national ID card yet, so the voter card serves as everyday ID. CENI tells voters to send this 11-digit "numéro national (NN)" by SMS or enter it in the CENI RDC Mobile app to find their polling station.

**Check digit:** none published; the library checks only length.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Nothing is published about what the digits encode. The length comes from press reports of CENI instructions.

Sources: https://infos.cd/?p=36195, https://fr.allafrica.com/stories/202411040384.html, https://irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=458935

### Congolese Tax Number (Numéro Impôt / NIF) — `CD_NIF`

Issued by: Direction Générale des Impôts (Décret 03/012 of 2003) · Holders: individuals and companies · Check digit: none known · Confidence: low

**Format:** 9 characters, letter + 7 digits + letter, written `A 0707219 F`. Example: `A0707219F`.

**Check digit:** none published; the library checks only the pattern.

**What the library extracts:** the 7-digit middle part as serial.

**Caveats:** The DGI publishes no format. The pattern is inferred from an example in a DGI VAT leaflet and from numbers on the DGI's approved-supplier list, so it is an observation, not a rule. Not re-verified online.

Sources: https://lookuptax.com/docs/country/dr-congo

## Switzerland (CH)

### Swiss Social Security Number (AHV/AVS) — `CH_AHV`

Issued by: Central Compensation Office (ZAS/CdC) · Holders: everyone insured in Swiss AHV/AVS (residents, cross-border workers) · Check digit: EAN-13 · Confidence: high

**Format:** 13 digits, written `756.NNNN.NNNN.NC`. Example: `756.9217.0769.85`.

| Part | Meaning |
|---|---|
| `756` | Switzerland's ISO 3166 numeric code |
| `NNNNNNNNN` | Random serial; nothing about the holder is encoded |
| `C` | EAN-13 check digit |

**Check digit:** Multiply the first 12 digits alternately by 1 and 3 (starting with 1), sum, and take (10 − sum mod 10) mod 10. Example `756921707698`: sum 125 → 5.

**What the library extracts:** the 9-digit serial.

**Caveats:** Since 2008 the number replaced the older 11-digit AHV number, which encoded name and birth date; the old format is not supported.

Sources: https://www.zas.admin.ch/zas/de/home/partenaires-et-institutions-/navs13.html, https://www.ahv-iv.ch/

### Swiss Business Identification Number (UID/IDE) — `CH_UID`

Issued by: Federal Statistical Office (BFS) · Holders: enterprises and other entities · Check digit: mod 11 · Confidence: high

**Format:** `CHE` + 9 digits, written `CHE-NNN.NNN.NNC`. Example: `CHE-109.322.551`. The 8 digits after `CHE` are random and carry no meaning; the 9th is the check digit.

**Check digit:** Multiply the 8 digits by 5, 4, 3, 2, 7, 6, 5, 4 and sum; r = sum mod 11; check = 11 − r, or 0 when r = 0. A remainder of 1 would give 10, so such numbers are never issued. Example `10932255`: sum 109, mod 11 = 10 → 1.

**What the library extracts:** validity only.

Sources: https://www.uid.admin.ch/, https://www.fedlex.admin.ch/eli/cc/2011/25/de, https://www.bfs.admin.ch/de/unternehmensidentifikation-uid

### Swiss VAT Number — `CH_MWST`

Issued by: Federal Tax Administration (ESTV/AFC), based on the UID · Holders: VAT-registered entities · Check digit: UID mod 11 · Confidence: high

**Format:** the UID followed by `MWST` (German), `TVA` (French) or `IVA` (Italian). Example: `CHE-109.322.551 MWST`.

**Check digit:** same as the UID above.

**What the library extracts:** the language suffix.

Sources: https://www.uid.admin.ch/, https://www.fedlex.admin.ch/eli/cc/2011/25/de, https://www.estv.admin.ch/

## Cook Islands (CK)

### Cook Islands Revenue Management Division Number — `CK_RMD`

Issued by: Revenue Management Division (Ministry of Finance and Economic Management) · Holders: individuals and entities that apply · Check digit: none known · Confidence: moderate

**Format:** 5 digits, `NNNNN`. Example: `12345`. Per the OECD TIN sheet the number is numeric, 5 digits, and is not issued automatically: individuals and entities get one only after applying (or being referred) to the RMD. Holders receive a confirmation letter.

**Check digit:** none published; the library checks only length.

**What the library extracts:** the number as serial.

**Caveats:** Cook Islanders are New Zealand citizens, but NZ has no national ID number, so the library does not map CK to NZ documents.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Cook-Islands-TIN.pdf, http://www.mfem.gov.ck/tax/forms-returns#registrations

## Chile (CL)

### Chilean National / Tax Roll Number (RUN/RUT) — `CL_RUT`

Issued by: Servicio de Registro Civil e Identificación (RUN, people) and Servicio de Impuestos Internos (RUT, entities) · Holders: people and legal entities · Check digit: mod 11 (0–9 or K) · Confidence: high

**Format:** 7–8 digit body + check character, written `NN.NNN.NNN-C`. Example: `12.345.678-5`. A person's RUN is also their RUT; companies get a RUT from SII. The body is sequential and encodes nothing about the holder.

**Check digit:** Multiply the body digits by 2, 3, 4, 5, 6, 7 repeating, starting from the rightmost digit; sum; compute 11 − (sum mod 11). 11 becomes 0 and 10 becomes K. Example `12345678`: weights from the left 3,2,7,6,5,4,3,2; sum 138, mod 11 = 6 → 5.

**What the library extracts:** the body as serial.

**Caveats:** The library requires 7–8 digit bodies; very old 1–6 digit RUTs exist but are rare and match too much text when guessing. An upstream library applied fixed weights from the left, which is wrong for 7-digit bodies; this library weights from the right.

Sources: https://www.sii.cl/portales/inicio_actividades/rut.html, https://www.registrocivil.cl/, https://es.wikipedia.org/wiki/Rol_%C3%9Anico_Tributario

### Chilean Passport Number — `CL_PASAPORTE`

Issued by: Servicio de Registro Civil e Identificación · Holders: Chilean citizens · Check digit: none known · Confidence: low

**Format:** 8–9 alphanumerics. Example: `F12345678`. Until 2013 the passport number equalled the holder's RUN; since the September 2013 document system, it is independent. The 2024 e-passport specification gives 9 alphanumeric characters. The library checks only length and pattern.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Older passports carrying the RUN as their number may still appear; they also match `CL_RUT`.

Sources: https://www.registrocivil.cl/principal/servicios-en-linea/pasaporte, https://en.wikipedia.org/wiki/Chilean_passport, https://www.diariooficial.interior.gob.cl/publicaciones/2024/12/07/44018/01/2580494.pdf

## Cameroon (CM)

### Cameroonian Unique Taxpayer Identifier (NIU) — `CM_NIU`

Issued by: Direction Générale des Impôts (DGI) · Holders: individuals and entities · Check digit: final letter, algorithm unpublished · Confidence: moderate

**Format:** 14 characters, `T NNNNNNNNNNNN L`. Example: `M099600009248R`.

| Part | Meaning |
|---|---|
| `T` | Taxpayer type: M legal entity, P individual / sole establishment |
| `NNNNNNNNNNNN` | 12 digits assigned by the DGI |
| `L` | Check letter |

**Check digit:** the final letter is computed by an internal DGI algorithm that isn't published; the library checks only the pattern.

**What the library extracts:** taxpayer type, check letter.

**Caveats:** One guide reads the digits as creation month/day, 2-digit year and an 8-digit serial, but contradicts itself for individuals, so they are not decoded. One tax site also lists an `E` (établissement) prefix; the library accepts only M and P.

Sources: https://org-id.guide/list/CM-NIU, https://taxdo.com/resources/global-tax-id-validation-guide/cameroon.md, https://lefisk.cm/blog/numero-identifiant-fiscal-cameroun-niu-format-obtention-verification

## China (CN)

### Chinese Resident Identity Number — `CN_RIC`

Issued by: Ministry of Public Security (standard GB 11643-1999) · Holders: citizens of mainland China; also holders of residence permits for Hong Kong, Macao and Taiwan residents (2018) · Check digit: ISO 7064 MOD 11-2 · Confidence: high

**Format:** 18 characters, `AAAAAA YYYYMMDD SSS C`. Example: `110105 19491231 002X`.

| Part | Meaning |
|---|---|
| `AAAAAA` | GB/T 2260 address code of first registration; first two digits are the province (11 Beijing … 65 Xinjiang); 810000/820000/830000 are HK/Macao/Taiwan residence permits |
| `YYYYMMDD` | Date of birth |
| `SSS` | Sequence; odd = male, even = female |
| `C` | Check character (0–9 or X) |

**Check digit:** Multiply the first 17 digits by 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2; sum; r = sum mod 11; the check is the r-th character of `10X98765432`. Example `11010519491231002`: sum 167, mod 11 = 2 → X.

**What the library extracts:** date of birth, age, gender, address code and province, serial, residence-permit flag.

**Caveats:** The library rejects unknown province codes and birth dates before 1800 or in the future.

Sources: https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=080D6FBF2BB468F9007657F26D60013E, https://www.gov.cn/zhengce/content/2018-08/19/content_5314865.htm, https://en.wikipedia.org/wiki/Resident_Identity_Card

### Chinese Resident Identity Number, 15-digit (pre-1999) — `CN_RIC15`

Issued by: Ministry of Public Security · Holders: citizens issued first-generation cards (1984–1999) · Check digit: none · Confidence: moderate · Deprecated

**Format:** 15 digits, `AAAAAA YYMMDD SSS`. Example: `110105 491231 002`.

| Part | Meaning |
|---|---|
| `AAAAAA` | Address code (as in the 18-digit number) |
| `YYMMDD` | Date of birth; century is always 19 |
| `SSS` | Sequence; odd = male, even = female |

**Check digit:** none. The 18-digit number is derived by inserting `19` before the year and appending the MOD 11-2 check.

**What the library extracts:** date of birth, age, gender, address code and province, serial.

**Caveats:** Still found in old records but no longer valid on cards.

Sources: https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=080D6FBF2BB468F9007657F26D60013E, https://en.wikipedia.org/wiki/Resident_Identity_Card

### Chinese Foreigner's Permanent Residence ID Card Number (2023) — `CN_FPRID`

Issued by: National Immigration Administration (NIA) · Holders: foreign permanent residents · Check digit: ISO 7064 MOD 11-2 · Confidence: moderate

**Format:** 18 characters, `9 PP NNN YYYYMMDD SSS C`. Example: `9 11 124 19750601 001 6`.

| Part | Meaning |
|---|---|
| `9` | Foreigner marker (citizen numbers start 1–8) |
| `PP` | Province where the card was applied for |
| `NNN` | Nationality, ISO 3166-1 numeric (124 = Canada) |
| `YYYYMMDD` | Date of birth |
| `SSS` | Sequence; odd = male, even = female |
| `C` | Check character, as for the citizen number |

**Check digit:** same weights and table as `CN_RIC`. Example `91112419750601001`: sum 248, mod 11 = 6 → 6.

**What the library extracts:** date of birth, age, gender, province, nationality code, serial, permanent-resident status.

**Caveats:** The NIA confirms the 9 prefix, 18 digits, MOD 11-2 check, and that nationality and application-place codes are included; exact field widths come from secondary descriptions. The 2017 card used 15 characters (3 letters + 12 digits) and is not covered.

Sources: https://www.nia.gov.cn/n741440/n741567/c1608297/content.html, https://www.nia.gov.cn/20231013/2.pdf, https://zh.wikipedia.org/wiki/外国人永久居留身份证

### Chinese Unified Social Credit Code — `CN_USCC`

Issued by: registration authorities (market regulation, civil affairs, institutional staffing, etc.) under GB 32100-2015 · Holders: legal persons and other organisations · Check digit: mod 31 · Confidence: high

**Format:** 18 characters from `0–9` and `A–Y` without I, O, S, V, Z. Example: `91350100M000100Y43`.

| Part | Meaning |
|---|---|
| `R` | Registration authority (e.g. 1 staffing office, 5 civil affairs, 9 market regulation) |
| `T` | Entity type within that authority |
| `AAAAAA` | Address code of the registering authority |
| `OOOOOOOOO` | Organisation code (8 characters + its own check) |
| `C` | Check character |

**Check digit:** Map each character to its index in `0123456789ABCDEFGHJKLMNPQRTUWXY` (0–30). Multiply the first 17 by 3^i mod 31 (1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28), sum, and take the character at index (31 − sum mod 31) mod 31. Example: sum 1640, mod 31 = 28 → index 3 → `3`.

**What the library extracts:** address code and province, registration authority, entity type, organisation code.

Sources: https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=24691C25985C1073D3A7C85629378AC0, https://zh.wikipedia.org/wiki/统一社会信用代码, https://en.wikipedia.org/wiki/Unified_Social_Credit_Identifier

## Colombia (CO)

### Colombian Citizenship Card Number (Cédula de ciudadanía) — `CO_CC`

Issued by: Registraduría Nacional del Estado Civil · Holders: citizens aged 18+ · Check digit: none · Confidence: moderate

**Format:** 6–10 digits, often written with thousands dots. Example: `1.020.304.050`. Numbers issued to people born since about 2000 are 10-digit NUIPs, assigned at birth registration and kept on the cédula. The number is sequential and encodes nothing about the holder.

**Check digit:** none; the library checks only length and pattern.

**What the library extracts:** citizenship (citizen).

**Caveats:** Bare 6–10 digit numbers overlap with many other identifiers. The DIAN check digit belongs to the NIT, not the cédula.

Sources: https://www.registraduria.gov.co/, https://en.wikipedia.org/wiki/Colombian_identity_card

### Colombian Minor's Identity Card Number (Tarjeta de identidad) — `CO_TI`

Issued by: Registraduría Nacional del Estado Civil · Holders: citizens aged 7–17 · Check digit: none · Confidence: low

**Format:** 10–11 digits. Example: `10123456789`. The library checks only length and pattern.

**What the library extracts:** citizenship (citizen).

**Caveats:** Not re-verified online.

Sources: https://www.registraduria.gov.co/

### Colombian Foreigner Identity Card Number (Cédula de extranjería) — `CO_CE`

Issued by: Migración Colombia · Holders: resident foreigners with visas longer than 3 months · Check digit: none · Confidence: low

**Format:** 6–8 digits. Example: `12345678`. The library checks only length and pattern.

**What the library extracts:** citizenship (foreigner).

**Caveats:** Not re-verified online.

Sources: https://www.migracioncolombia.gov.co/

### Colombian Special Stay Permit Number (PEP) — `CO_PEP`

Issued by: Migración Colombia (Resolución 5797/2017) · Holders: Venezuelan migrants · Check digit: none · Confidence: low

**Format:** 15 digits. Example: `123456789012345`. The library checks only length and pattern.

**What the library extracts:** citizenship (foreigner).

**Caveats:** The PEP is being replaced by the PPT. Not re-verified online.

Sources: https://www.migracioncolombia.gov.co/

### Colombian Temporary Protection Permit Number (PPT) — `CO_PPT`

Issued by: Migración Colombia (Decreto 216/2021) · Holders: Venezuelan migrants under the temporary protection statute · Check digit: none · Confidence: low

**Format:** 7–11 alphanumerics. Example: `12345678901`. The library checks only length and pattern.

**What the library extracts:** citizenship (foreigner).

**Caveats:** Not re-verified online.

Sources: https://www.migracioncolombia.gov.co/visas-permisos/permiso-por-proteccion-temporal-ppt

### Colombian Tax Identification Number (NIT) — `CO_NIT`

Issued by: Dirección de Impuestos y Aduanas Nacionales (DIAN), via the RUT register · Holders: individuals and entities · Check digit: DIAN mod 11 (DV) · Confidence: high

**Format:** base + 1 check digit (DV), written `NNN.NNN.NNN-D`. Example: `900.123.456-8`. Companies get a 9-digit base (usually 8xx/9xx million); individuals use their cédula as the base.

**Check digit:** Multiply base digits from the right by 3, 7, 13, 17, 19, 23, 29, 37, 41, 43 (rightmost × 3); sum; r = sum mod 11; DV = r if r is 0 or 1, otherwise 11 − r. Example `900123456`: sum 586, mod 11 = 3 → 8.

**What the library extracts:** base as serial, check digit.

**Caveats:** The DIAN weight list continues (47, 53, 59, 67, 71) for longer bases; the library supports bases up to 10 digits. All-same-digit bases are rejected.

Sources: https://www.dian.gov.co/, https://es.wikipedia.org/wiki/N%C3%BAmero_de_Identificaci%C3%B3n_Tributaria

### Colombian Passport Number — `CO_PASAPORTE`

Issued by: Ministerio de Relaciones Exteriores (Cancillería) · Holders: Colombian citizens · Check digit: none known · Confidence: low

**Format:** 6–12 alphanumerics. Example: `AB1234567890`. No published structure; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Not re-verified online.

Sources: https://www.cancilleria.gov.co/tramites_servicios/pasaportes

## Costa Rica (CR)

### Costa Rican Identity Card Number (Cédula de identidad) — `CR_CEDULA_FISICA`

Issued by: Tribunal Supremo de Elecciones (Registro Civil) · Holders: citizens; also their personal tax ID · Check digit: none · Confidence: high

**Format:** 9 digits, written `P-TTTT-AAAA`. Example: `1-1234-5678`.

| Part | Meaning |
|---|---|
| `P` | Province of registration: 1 San José, 2 Alajuela, 3 Cartago, 4 Heredia, 5 Guanacaste, 6 Puntarenas, 7 Limón, 8 naturalised citizens, 9 partida especial (late registration / born abroad) |
| `TTTT` | Tomo (register volume) |
| `AAAA` | Asiento (entry in the volume) |

**Check digit:** none; the TSE and Hacienda verify numbers against their registries. The library checks only the pattern.

**What the library extracts:** province code and name, tomo, asiento, citizenship (naturalised for 8).

Sources: https://www.tse.go.cr/, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Costa-Rica-TIN.pdf, https://en.wikipedia.org/wiki/Costa_Rican_identity_card

### Costa Rican Foreigner Identity Document (DIMEX) — `CR_DIMEX`

Issued by: Dirección General de Migración y Extranjería · Holders: foreigners with regular migration status · Check digit: none known · Confidence: moderate

**Format:** 11 or 12 digits (OECD TIN sheet). Example: `155812345678`. The library checks only length and pattern.

**What the library extracts:** citizenship (foreigner).

**Caveats:** No official source describes what the digits encode, so nothing is decoded.

Sources: https://www.migracion.go.cr/, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Costa-Rica-TIN.pdf

### Costa Rican Legal Entity Number (Cédula jurídica) — `CR_CEDULA_JURIDICA`

Issued by: Registro Nacional · Holders: legal entities, government bodies · Check digit: none · Confidence: high

**Format:** 10 digits, written `C-TTT-NNNNNN`. Example: `3-101-123456`.

| Part | Meaning |
|---|---|
| `C` | Class: 2 central government, 3 private legal persons, 4 autonomous institutions |
| `TTT` | Entity type within the class (e.g. 101 sociedad anónima, 102 SRL) |
| `NNNNNN` | Serial |

**Check digit:** none; the library checks only the pattern.

**What the library extracts:** class, entity type code, serial.

Sources: https://www.registronacional.go.cr/, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Costa-Rica-TIN.pdf

### Costa Rican Special Tax Identification Number (NITE) — `CR_NITE`

Issued by: Dirección General de Tributación (Ministerio de Hacienda) · Holders: people and entities that need a tax ID but have no cédula or DIMEX · Check digit: none · Confidence: moderate

**Format:** 10 digits: `3-120-NNNNNN` for natural persons, `3-130-NNNNNN` for entities (OECD TIN sheet). Example: `3-120-123456`.

**Check digit:** none; the library checks only the pattern.

**What the library extracts:** holder kind (natural person / entity), serial.

**Caveats:** NITE numbers share the leading `3` with cédulas jurídicas, so a bare 10-digit number can match both.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Costa-Rica-TIN.pdf, https://www.hacienda.go.cr/

### Costa Rican Passport Number — `CR_PASAPORTE`

Issued by: Dirección General de Migración y Extranjería · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 9 alphanumerics. Example: `C12345678`. No published structure; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Not re-verified online.

Sources: https://www.migracion.go.cr/, https://en.wikipedia.org/wiki/Costa_Rican_passport

## Cuba (CU)

### Cuban Identity Card Number — `CU_CI`

Issued by: Ministerio del Interior (MININT) · Holders: citizens and residents · Check digit: one, algorithm unpublished · Confidence: low

**Format:** 11 digits, `YYMMDD C SS G X`. Example: `861205 0 12 3 4`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth |
| `C` | Century: 9 → 1800s, 0–5 → 1900s, 6–8 → 2000s |
| `SS` | Sequence for people born on the same day |
| `G` | Sex: even male, odd female |
| `X` | Control digit |

The example reads as a man born 5 December 1986.

**Check digit:** described as a control digit, but no algorithm is published; the library does not verify it.

**What the library extracts:** date of birth, age, gender, sequence, century digit.

**Caveats:** MININT doesn't publish the layout; it comes from secondary sources that agree. Cuba's new identity law keeps a permanent, unchangeable identity number, but its regulations could change details.

Sources: https://lookuptax.com/docs/es/numero-identificacion-fiscal/guia-nit-carnet-identidad-cuba, https://arthurdejong.org/python-stdnum/doc/stdnum.cu.ni

## Curaçao (CW)

### Curaçao Tax Identification Number (CRIB / persoonsnummer) — `CW_CRIB`

Issued by: Inspectie der Belastingen (Department of Taxes) · Holders: people and entities registered with the tax department · Check digit: none published · Confidence: moderate

**Format:** 9 digits. Example: `123456789`. Per the OECD TIN sheet, the number is generated by the tax system after the taxpayer's data is registered, and the same number is used for every tax. No structure is published.

**Check digit:** none published; the library checks only length.

**What the library extracts:** the number as serial.

**Caveats:** Sint Maarten's CRIB numbers (same Netherlands Antilles origin) are said to pass an "11-proof", but Curaçao doesn't state this and no weights are published, so none is applied. The identity-card number is not covered.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Curacao-TIN.pdf, https://lookuptax.com/docs/tax-identification-number/curacao-tax-id-guide

## Cyprus (CY)

### Cyprus Tax Identification Code (TIC / ΑΦΤ) — `CY_VAT`

Issued by: Tax Department (Ministry of Finance) · Holders: individuals and entities obliged to register · Check digit: check letter (mod 26) · Confidence: high

**Format:** 8 digits + 1 uppercase Latin letter. Example: `00123456H`. The VAT number is the same code with a `CY` prefix (optional on input).

**Check digit:** Digits at positions 1, 3, 5, 7 (counting from 1) are converted 0→1, 1→0, 2→5, 3→7, 4→9, 5→13, 6→15, 7→17, 8→19, 9→21; digits at positions 2, 4, 6, 8 count as themselves. Sum everything; sum mod 26 indexes A–Z (0 = A). Example `00123456`: 1+0+0+2+7+4+13+6 = 33, mod 26 = 7 → H.

**What the library extracts:** validity only.

**Caveats:** The Tax Department says only that the letter comes "from an algorithm"; the rule above is the one used for VIES VAT checks. Since 27 March 2023 the Tax For All system issues TICs from 60000000 to everyone, so the first digit no longer distinguishes persons from companies. Numbers starting `12` are not issued and are rejected.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Cyprus-TIN.pdf, https://ec.europa.eu/taxation_customs/vies/, https://en.wikipedia.org/wiki/VAT_identification_number

## Czechia (CZ)

### Czech Birth Number (Rodné číslo) — `CZ_RC`

Issued by: Ministry of the Interior (population register), law 133/2000 Sb. § 13 · Holders: citizens and permanent residents · Check digit: whole number divisible by 11 (from 1954) · Confidence: high

**Format:** 9 or 10 digits, written `YYMMDD/SSS[C]`. Example: `710319/2745`.

| Part | Meaning |
|---|---|
| `YY` | Year of birth (century from length, see below) |
| `MM` | Month; +50 for women; +20 (men) / +70 (women) for the supplementary series since 2004 |
| `DD` | Day of birth |
| `SSS` | Serial for that date |
| `C` | Check digit (10-digit numbers only) |

Before 1954: 9 digits, no check digit; YY 00–53 → 19YY (YY 54–99 → 18YY). From 1954: 10 digits; YY 54–99 → 19YY, 00–53 → 20YY.

**Check digit:** The 10-digit number must be divisible by 11. Equivalently, take the first 9 digits mod 11; the remainder is the check digit. Until 1985 about a thousand numbers had remainder 10 and check digit 0; the library accepts these for 1954–1985 and flags them. Example `7103192745` mod 11 = 0: a man born 19 March 1971.

**What the library extracts:** date of birth, age, gender, serial, flags for the remainder-10 exception and the +20 series.

Sources: https://www.zakonyprolidi.cz/cs/2000-133#p13, https://www.cssz.gov.cz/standardni-kontrola-rodneho-cisla-a-evidencniho-cisla-pojistence, https://cs.wikipedia.org/wiki/Rodn%C3%A9_%C4%8D%C3%ADslo

### Czech Social Insurance Number for Foreigners (EČP) — `CZ_ECP`

Issued by: Czech Social Security Administration (ČSSZ) · Holders: insured foreigners without a rodné číslo · Check digit: as rodné číslo · Confidence: high

**Format:** the rodné číslo shape with 40 added to the day. Example: `710359/6005`.

| Part | Meaning |
|---|---|
| `YYMM` | As in the rodné číslo (month +50 for women) |
| `DD` | Day + 40, for both sexes |
| `SSS[S]` | Serial, ≥ 600 (9 digits) or ≥ 6000 (10 digits) |

**Check digit:** same as the rodné číslo (10-digit form divisible by 11). Example `7103596005` mod 11 = 0: a man born 19 March 1971.

**What the library extracts:** date of birth, age, gender, serial, foreigner status.

**Caveats:** ČSSZ rejects day + 40 combined with month + 20; so does the library.

Sources: https://www.cssz.gov.cz/standardni-kontrola-rodneho-cisla-a-evidencniho-cisla-pojistence

### Czech Tax Identification Number (DIČ) — `CZ_DIC`

Issued by: Financial Administration (Finanční správa) · Holders: legal entities and individuals · Check digit: mod 11 (entities) or rodné číslo rule (individuals) · Confidence: high

**Format:** `CZ` + 8 digits (legal entities, the IČO) or `CZ` + rodné číslo (individuals, 9–10 digits). Example: `CZ12345679`.

**Check digit:** Entities: multiply the first 7 digits by 8, 7, 6, 5, 4, 3, 2; sum; check = (11 − sum mod 11) mod 10. Example `1234567`: sum 112, mod 11 = 2 → 9. The first digit must not be 9. Individuals: rodné číslo rules.

**What the library extracts:** holder kind; for individuals, everything extracted from the rodné číslo.

**Caveats:** The 9-digit "special" DIČ (`CZ6…`) for people without a rodné číslo is not supported; no issuer publication of its check rule was found.

Sources: https://www.financnisprava.cz/cs/dane/dane/dan-z-pridane-hodnoty, https://www.zakonyprolidi.cz/cs/2004-235, https://ec.europa.eu/taxation_customs/vies/

## Germany (DE)

### German Tax Identification Number (Steuer-ID / IdNr) — `DE_STEUER_ID`

Issued by: Bundeszentralamt für Steuern (BZSt), § 139b AO · Holders: everyone registered in Germany, from birth · Check digit: ISO 7064 MOD 11,10 · Confidence: high

**Format:** 11 digits, written `NN NNN NNN NNN`. Example: `86 095 742 719`. Germany has no general personal ID number; this is the lifelong per-person tax number. Nothing about the holder is encoded.

Structure rules on the first 10 digits: the first digit is not 0; exactly one digit appears twice or three times and every other digit at most once; a digit that appears three times may not fill three consecutive positions.

**Check digit:** ISO 7064 MOD 11,10. Start with P = 10. For each of the 10 digits: S = (digit + P) mod 10, with 0 replaced by 10; P = (2 × S) mod 11. The check digit is (11 − P) mod 10. Example `8609574271` (7 appears twice): final P = 2 → 9.

**What the library extracts:** validity only.

Sources: https://www.gesetze-im-internet.de/ao_1977/__139b.html, https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html, https://download.elster.de/download/schnittstellen/Pruefung_der_Steuer_und_Steueridentifikatsnummer.pdf

### German Tax Number (Steuernummer) — `DE_STEUERNUMMER`

Issued by: the local tax office (Finanzamt) of each Land · Holders: individuals and businesses · Check digit: Land-specific, not checked · Confidence: low

**Format:** 10 or 11 digits in the Land's own layout, or the 13-digit nationwide ELSTER form `FFFF0BBBUUUUP`. Example: `9181081508155`.

| Part (13-digit) | Meaning |
|---|---|
| `FFFF` | Bundesfinanzamtsnummer (Land + tax office) |
| `0` | Fixed 0 |
| `BBB` | District |
| `UUUU` | Serial |
| `P` | Check digit |

**Check digit:** the method differs by Land; the library checks only length, pattern and the fixed 0.

**What the library extracts:** for the 13-digit form, the 4-digit tax office number; the format kind.

**Caveats:** A tax number changes when the holder moves to another tax office.

Sources: https://download.elster.de/download/schnittstellen/Pruefung_der_Steuer_und_Steueridentifikatsnummer.pdf, https://de.wikipedia.org/wiki/Steuernummer

### German VAT Identification Number (USt-IdNr) — `DE_USTID`

Issued by: Bundeszentralamt für Steuern (BZSt) · Holders: businesses trading within the EU · Check digit: ISO 7064 MOD 11,10 · Confidence: high

**Format:** `DE` + 9 digits, first digit 1–9. Example: `DE 136 695 976`.

**Check digit:** ISO 7064 MOD 11,10 (as for the Steuer-ID) over the first 8 digits. Example `13669597` → 6.

**What the library extracts:** validity only.

Sources: https://www.bzst.de/DE/Unternehmen/Identifikationsnummern/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html, https://ec.europa.eu/taxation_customs/vies/

## Denmark (DK)

### Danish Personal Identification Number (CPR-nummer) — `DK_CPR`

Issued by: CPR-kontoret (Civil Registration System) · Holders: everyone registered in Denmark · Check digit: modulus 11, no longer guaranteed · Confidence: high

**Format:** 10 digits, written `DDMMYY-SSSS`. Example: `010160-1234`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth |
| 7th digit | Together with YY gives the century: 0–3 → 1900s; 4 or 9 → YY 00–36 is 2000s, 37–99 is 1900s; 5–8 → YY 00–57 is 2000s, 58–99 is 1800s |
| digits 8–9 | Serial |
| 10th digit | Odd = male, even = female |

The example reads as a woman born 1 January 1960.

**Check digit:** Historically, the weighted sum with weights 4, 3, 2, 7, 6, 5, 4, 3, 2, 1 was divisible by 11. Since 2007 numbers are issued that fail this check, so the library does not enforce it; it reports the result. Example `0101601234`: sum 66, mod 11 = 0 → passes.

**What the library extracts:** date of birth, age, gender, serial, whether the modulus-11 check passes.

Sources: https://admin.cpr.dk/media/12066/personnummeret-i-cpr.pdf, https://cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol, https://en.wikipedia.org/wiki/Personal_identification_number_(Denmark)

### Danish Business Registration Number (CVR-nummer) — `DK_CVR`

Issued by: Danish Business Authority (Erhvervsstyrelsen), Central Business Register · Holders: companies and other businesses · Check digit: modulus 11 · Confidence: high

**Format:** 8 digits. Example: `13585628`. No internal structure.

**Check digit:** Multiply the digits by 2, 7, 6, 5, 4, 3, 2, 1; the sum must be divisible by 11. Example `13585628`: sum 143 = 13 × 11.

**What the library extracts:** validity only.

Sources: https://datacvr.virk.dk/, https://en.wikipedia.org/wiki/VAT_identification_number

### Danish VAT Number — `DK_VAT`

Issued by: Danish Tax Agency (Skattestyrelsen) · Holders: VAT-registered businesses · Check digit: modulus 11 (CVR) · Confidence: high

**Format:** `DK` + the 8-digit CVR number, written `DK 13 58 56 28`. Example: `DK13585628`.

**Check digit:** same as the CVR number.

**What the library extracts:** validity only.

Sources: https://skat.dk/, https://ec.europa.eu/taxation_customs/vies/

## Dominica (DM)

### Dominica Taxpayer Identification Number — `DM_TIN`

Issued by: Inland Revenue Division · Holders: individuals and entities, on application or after third-party information · Check digit: one, algorithm unpublished · Confidence: low

**Format:** up to 6 digits plus 1 check digit. Example: `1234567`. Per the OECD TIN sheet, numbers are generated sequentially by the SIGTAS tax software; the "taxpayer number" used in practice is the first six digits, without the check digit. A TIN changes only when a business changes form (e.g. sole proprietorship to corporation).

**Check digit:** not published; the library accepts 1–7 digits with a non-zero first digit and checks only the shape.

**What the library extracts:** validity of shape only.

**Caveats:** A number may be quoted with or without its check digit, and the two cannot be told apart. The non-zero-first-digit rule is an assumption, not stated by the sheet.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/dominica-tin.pdf

## Dominican Republic (DO)

### Dominican Identity and Electoral Card Number — `DO_CEDULA`

Issued by: Junta Central Electoral (JCE), Ley 8-92 · Holders: citizens · Check digit: Luhn · Confidence: moderate

**Format:** 11 digits, `SSS NNNNNNN C`, written `SSS-NNNNNNN-C`. Example: `402-0000001-2`.

| Part | Meaning |
|---|---|
| `SSS` | Series. It historically identified the issuing municipality; almost all cards issued today use series 402 |
| `NNNNNNN` | Sequence number |
| `C` | Luhn check digit over the first 10 digits |

**Check digit:** Standard Luhn. Starting from the rightmost body digit, double every second digit (subtract 9 if the result exceeds 9), add everything including the check digit, and the total must be a multiple of 10. For `40200000012` the contributions are 4,0,2,0,0,0,0,0,0,2,2 = 10, so it is valid. The cédula also serves as the RNC (tax number) of natural persons.

**What the library extracts:** series, serial, citizenship (citizen), and a `luhnException` flag.

**Caveats:** Some genuinely issued cédulas fail Luhn. The library accepts a fixed list of 576 such numbers (published as factual data by the idnumbers project) and flags them, where a plain Luhn validator would reject them. The series is returned raw and not mapped to a place.

Sources: https://jce.gob.do/, https://en.wikipedia.org/wiki/National_identification_number#Dominican_Republic, https://en.wikipedia.org/wiki/National_Identity_Card_(Dominican_Republic)

### Dominican Taxpayer Number — `DO_RNC`

Issued by: Dirección General de Impuestos Internos (DGII), Ley 11-92 · Holders: legal entities · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 9 digits, written `N-NN-NNNNN-C`. Example: `1-30-12345-4`. Natural persons use their 11-digit cédula as RNC instead.

**Check digit:** Multiply the first 8 digits by 7, 9, 8, 6, 5, 4, 3, 2 and sum. Let r = sum mod 11. The check digit is 2 if r = 0, 1 if r = 1, otherwise 11 − r. For `13012345`: 7+27+0+6+10+12+12+10 = 84, r = 7, check = 4.

**What the library extracts:** nothing beyond validity. All-same-digit numbers (e.g. `222222222`, which passes the check) are rejected as placeholders.

Sources: https://dgii.gov.do/, https://en.wikipedia.org/wiki/VAT_identification_number

### Dominican Passport Number — `DO_PASAPORTE`

Issued by: Dirección General de Pasaportes · Holders: citizens · Check digit: none known · Confidence: moderate

**Format:** 2 letters + 7 digits. Example: `SD1234567`.

**Check digit:** None on the printed number (the MRZ has its own ICAO check digits, which the library does not use). The library checks only length and pattern.

**What the library extracts:** the two-letter prefix as `office`.

**Caveats:** Not re-verified online. Reading the prefix as an issuing office comes from the nationid port and is not confirmed by an issuer source.

Sources: https://www.consilium.europa.eu/prado/en/prado-documents/dom/a/docs-per-category.html

## Algeria (DZ)

### Algerian National Identification Number — `DZ_NIN`

Issued by: Ministry of the Interior (civil registry), Décret exécutif 10-210 (2010), replaced in 2023 · Holders: everyone registered in the Algerian civil status registers · Check digit: two-digit key, algorithm not published · Confidence: moderate

**Format:** 18 digits, `AA YYY CCCC NNNNN SS KK`. Example: `10 985 0160 01234 01 45`.

| Part | Meaning |
|---|---|
| `AA` | Status: sex, mention on the birth act (bis, ter, quater, presumed), born in Algeria or abroad, naturalisation |
| `YYY` | Last three digits of the year the birth was entered in the register (not necessarily the birth year) |
| `CCCC` | Commune of birth, or country of birth for people born abroad |
| `NNNNN` | Birth-act number |
| `SS` | Register series within the year |
| `KK` | Control key |

**Check digit:** The Interior Ministry describes the last two positions as a control key but has not published how it is computed. The library does not verify it.

**What the library extracts:** commune/country code (`region`), birth-act number (`serial`), and raw `statusCode`, `registrationYearDigits`, `registerSeries`, `controlKey`.

**Caveats:** No code table for `AA` is published, so the library sets no gender. The segment layout comes from one ministry presentation (ID4Africa 2019) and has not been checked against real numbers. The 2023 decree keeps 18 digits and a control key.

Sources: https://www.id4africa.com/2019_event/presentations/InF3/4-Abderrazak-Henni-MOI-Algeria.pdf, https://www.joradp.dz/FTP/jo-francais/2010/F2010054.pdf, https://algerie-eco.com/?p=176249

### Algerian Tax Identification Number — `DZ_NIF`

Issued by: Direction Générale des Impôts (DGI) · Holders: individuals and companies · Check digit: none known · Confidence: moderate

**Format:** 15 digits, or 20 digits for secondary establishments. Example: `416001000000007`.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** whether the number is a 20-digit secondary-establishment form.

**Caveats:** Not re-verified online. Claims that the NIF encodes the wilaya or legal form appear only on blogs, so nothing is decoded.

Sources: https://www.mfdgi.gov.dz/, https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.dz.nif

## Ecuador (EC)

### Ecuadorian Identity Card Number — `EC_CEDULA`

Issued by: Registro Civil (Dirección General de Registro Civil, Identificación y Cedulación) · Holders: citizens and resident foreigners · Check digit: Luhn-style mod 10 · Confidence: high

**Format:** 10 digits, `PP T SSSSSS C`. Example: `1710034065`.

| Part | Meaning |
|---|---|
| `PP` | Province of registration, 01–24, or 30 for Ecuadorians registered abroad |
| `T` | 0–5 for natural persons (6 and 9 are used only in company RUCs) |
| `SSSSSS` | Sequence |
| `C` | Check digit |

**Check digit:** Weights 2,1,2,1,… over the first 9 digits; any product above 9 has 9 subtracted; check = (10 − sum mod 10) mod 10. For `171003406`: 2+7+2+0+0+3+8+0+3 = 25, check = 5.

**What the library extracts:** province code and name, serial.

**Caveats:** One upstream (idnumbers) restricts the third digit to 4–5 for province 30, based on an issue thread; the Registro Civil publishes no such rule, so the library keeps 0–5.

Sources: https://www.registrocivil.gob.ec/, https://www.sri.gob.ec/, https://en.wikipedia.org/wiki/National_identification_number#Ecuador

### Ecuadorian Taxpayer Registry Number — `EC_RUC`

Issued by: Servicio de Rentas Internas (SRI) · Holders: individuals and entities · Check digit: depends on the third digit · Confidence: high

**Format:** 13 digits ending in `001`. Example: `1710034065001` (natural person); `1790011674001` (private company).

| Third digit | Layout |
|---|---|
| 0–5 | Natural person: the holder's cédula (10 digits) + `001` |
| 6 | Public entity: 8 digits + check digit (position 9) + `0` + `001` |
| 9 | Private company or foreigner without cédula: 9 digits + check digit (position 10) + `001` |

**Check digit:** Natural persons: the cédula rule. Public (6): weights 3,2,7,6,5,4,3,2 over the first 8 digits. Private (9): weights 4,3,2,7,6,5,4,3,2 over the first 9 digits. In both, r = sum mod 11 and check = 0 if r = 0, else 11 − r. For `179001167`: 4+21+18+0+0+5+4+18+14 = 84, r = 7, check = 4. Only the natural-person check is enforced; for types 6 and 9 the mod-11 result is reported, not enforced (see Caveats).

**What the library extracts:** province, serial, kind (natural, public, private), for natural persons the embedded cédula, and for types 6 and 9 `extra.checkDigitValid` (whether the mod-11 check matched).

**Caveats:** The library rejects any suffix other than `001` (SRI says the RUC always ends in 001; branches are numbered separately), unlike nationid, which reads it as a branch number. SRI's e-invoicing pages say RUCs of companies, public bodies and foreigners without cédula "no tienen una validación con un algoritmo específico", so genuine type-6 or type-9 RUCs can fail the mod-11 check. The library therefore accepts type-6/9 RUCs whatever the check digit and sets `extra.checkDigitValid`; unlike nationid, it does not reject them. For such a number `identify()` reports `checksumVerified: false`, and it doesn't count it as evidence when guessing the country.

Sources: https://www.sri.gob.ec/web/intersri/ruc, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ecuador-TIN.pdf, https://lookuptax.com/docs/tax-identification-number/ecuador-tax-id-guide

### Ecuadorian Passport Number — `EC_PASAPORTE`

Issued by: Ministerio de Relaciones Exteriores (Cancillería) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 8 or 9 letters/digits. Example: `A12345678`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online. The pattern is loose and will match many unrelated strings.

Sources: https://www.cancilleria.gob.ec/, https://en.wikipedia.org/wiki/Ecuadorian_passport

## Estonia (EE)

### Estonian Personal Identification Code — `EE_ISIKUKOOD`

Issued by: Population register (Ministry of the Interior), standard EVS 585 · Holders: citizens and residents; also the individual TIN · Check digit: two-pass mod 11 · Confidence: high

**Format:** 11 digits, `G YYMMDD SSS C`. Example: `38001010009`.

| Part | Meaning |
|---|---|
| `G` | Sex and century: 1/2 = 1800s, 3/4 = 1900s, 5/6 = 2000s; odd male, even female |
| `YYMMDD` | Date of birth |
| `SSS` | Serial for people born the same day (before 2013 it also identified the hospital) |
| `C` | Check digit |

**Check digit:** Multiply the first 10 digits by 1,2,3,4,5,6,7,8,9,1 and take the sum mod 11. If the remainder is under 10, that is the check digit. If it is 10, repeat with weights 3,4,5,6,7,8,9,1,2,3; if that remainder is also 10, the check digit is 0. For `3800101000`: 3·1 + 8·2 + 1·5 + 1·7 = 31 (the other digits are 0), 31 mod 11 = 9, so the check digit is 9. The same algorithm is used in Lithuania.

**What the library extracts:** date of birth, age, gender, serial.

**Caveats:** Some sources mention G = 7/8 for the 2100s, but the standard doesn't define them; the library rejects them. Future birth dates are rejected.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/estonia-tin.pdf, https://www.riigiteataja.ee/akt/106032012004, https://et.wikipedia.org/wiki/Isikukood

### Estonian VAT Number — `EE_VAT`

Issued by: Estonian Tax and Customs Board (EMTA) · Holders: VAT-registered businesses · Check digit: weighted mod 10 · Confidence: moderate

**Format:** `EE` + 9 digits. Example: `EE100931558`.

**Check digit:** Multiply the 9 digits by 3,7,1,3,7,1,3,7,1. The sum must be a multiple of 10. For `100931558`: 3+0+0+27+21+1+15+35+8 = 110, valid.

**What the library extracts:** nothing beyond validity. Bare 9-digit input gets the `EE` prefix added.

**Caveats:** Not re-verified online beyond the module's sources.

Sources: https://www.emta.ee/en/business-client/registration-business/vat-registration, https://ec.europa.eu/taxation_customs/vies/

## Egypt (EG)

### Egyptian National ID Number — `EG_NID`

Issued by: Civil Status Organization (Ministry of Interior) · Holders: citizens · Check digit: one digit, algorithm not published · Confidence: moderate

**Format:** 14 digits, `C YYMMDD GG SSSS K`. Example: `2 900101 01 0001 7`.

| Part | Meaning |
|---|---|
| `C` | Century of birth: 2 = 1900s, 3 = 2000s |
| `YYMMDD` | Date of birth |
| `GG` | Governorate of birth (01 Cairo, 02 Alexandria, …, 35 South Sinai); 88 = born outside Egypt |
| `SSSS` | Serial; the last digit is odd for men, even for women |
| `K` | Check digit |

**Check digit:** The Civil Status Organization has not published the algorithm. Luhn is ruled out and mod-11 guesses are unproven, so the library does not verify it.

**What the library extracts:** date of birth, age, gender, governorate code and name, serial, and `bornAbroad`.

**Caveats:** Unknown governorate codes are rejected. The library rejects future birth dates (idnumbers accepts them) and returns the date as a plain string rather than a timezone-shifted `Date`.

Sources: https://www.cso.gov.eg/, https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card, https://github.com/identique/idnumbers-npm/blob/main/docs/research/egypt-national-id.md

## Spain (ES)

### Spanish National Identity Document Number — `ES_DNI`

Issued by: Dirección General de la Policía, RD 1553/2005 · Holders: Spanish citizens; the DNI number is also their NIF · Check digit: mod 23 letter · Confidence: high

**Format:** 8 digits + 1 letter. Example: `12345678Z`.

**Check digit:** Take the 8-digit number mod 23 and look up the letter in `TRWAGMYFPDXBNJZSQVHLCKE` (index 0 = T). 12345678 mod 23 = 14 → `Z`. The table never uses I, Ñ, O or U.

**What the library extracts:** serial (the 8 digits), citizenship (citizen).

**Caveats:** `00000000T` passes the letter check but was never issued; the library rejects it.

Sources: https://www.boe.es/buscar/act.php?id=BOE-A-2005-21163, https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/

### Spanish Foreigner Identity Number — `ES_NIE`

Issued by: Dirección General de la Policía, Orden INT/2058/2008 · Holders: foreigners · Check digit: mod 23 letter · Confidence: high

**Format:** `X`, `Y` or `Z` + 7 digits + letter. Example: `X1234567L`.

**Check digit:** Replace X→0, Y→1, Z→2, then apply the DNI rule to the resulting 8-digit number. `01234567` mod 23 = 19 → `L`. X numbers were issued until July 2008, then Y, then Z.

**What the library extracts:** prefix letter, serial, citizenship (foreigner).

Sources: https://www.boe.es/buscar/doc.php?id=BOE-A-2008-11975, https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/

### Spanish Personal Tax Number (K/L/M) — `ES_NIF_KLM`

Issued by: Agencia Tributaria, Orden EHA/451/2008 · Holders: people without DNI/NIE · Check digit: mod 23 letter · Confidence: moderate

**Format:** `K`, `L` or `M` + 7 digits + letter. Example: `K1234567L`.

| Part | Meaning |
|---|---|
| `K` | Spaniard under 14 without DNI |
| `L` | Spaniard resident abroad without DNI |
| `M` | Foreigner without NIE |

**Check digit:** The DNI letter table applied to the 7 digits (the prefix letter is ignored). 1234567 mod 23 = 19 → `L`.

**What the library extracts:** kind, serial, citizenship (citizen for K/L, foreigner for M).

**Caveats:** Not re-verified online. Neither upstream library handles these.

Sources: https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580, https://sede.agenciatributaria.gob.es/

### Spanish Company Tax Number — `ES_NIF_PJ`

Issued by: Agencia Tributaria, Orden EHA/451/2008 · Holders: legal entities and entities without legal personality (former CIF) · Check digit: Luhn-style, digit or letter · Confidence: high

**Format:** entity-type letter + 7 digits + control character. Example: `A58818501`.

| Part | Meaning |
|---|---|
| Letter | Legal form, e.g. A sociedad anónima, B sociedad limitada, E comunidad de bienes, H comunidad de propietarios, J sociedad civil, N foreign entity, P local authority, Q public body, R religious institution, S state/regional administration, W permanent establishment of a non-resident |
| 2 digits | Province of registration |
| 5 digits | Sequence |
| Control | Digit or letter |

**Check digit:** Over the 7 digits, double those in odd positions (1st, 3rd, …), subtracting 9 if over 9, and add the even-position digits unchanged. r = (10 − sum mod 10) mod 10. The control is the digit r for A, B, E, H; the letter `JABCDEFGHI`[r] for N, P, Q, R, S, W; either for the rest. For `5881850`: 1+8+7+1+7+5+0 = 29, r = 1, so `A58818501`.

**What the library extracts:** province code, serial, entity-type letter. An `ES` VAT prefix is stripped.

Sources: https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580, https://sede.agenciatributaria.gob.es/Sede/procedimientos/G324.shtml

### Spanish Social Security Number — `ES_NUSS`

Issued by: Tesorería General de la Seguridad Social (TGSS) · Holders: anyone affiliated to Spanish social security · Check digit: mod 97 (two digits) · Confidence: moderate

**Format:** 12 digits, `PP NNNNNNNN CC`, written `PP/NNNNNNNN/CC`. Example: `28/12345678/40`.

| Part | Meaning |
|---|---|
| `PP` | Province where the number was assigned |
| `NNNNNNNN` | Sequence |
| `CC` | Control digits |

**Check digit:** CC = (the first 10 digits as a number) mod 97. 2812345678 mod 97 = 40. For sequence numbers below 10 000 000 a widely used TGSS variant computes (PP·10⁷ + sequence) mod 97 instead; the library accepts either for those.

**What the library extracts:** province code, sequence.

**Caveats:** Not re-verified online: no official TGSS document describing the mod-97 rule was found, so the short-form variant rests on common practice.

Sources: https://portal.seg-social.gob.es/, https://www.seg-social.es/

## Ethiopia (ET)

### Ethiopian Fayda Identification Number — `ET_FIN`

Issued by: National ID Program (NIDP), Digital Identification Proclamation 1284/2023 · Holders: eligible residents · Check digit: none known · Confidence: low

**Format:** 12 digits, written `NNNN NNNN NNNN`. Example: `1234 5678 9012`.

**Check digit:** None published. Fayda runs on MOSIP, whose default number generator ends in a Verhoeff check digit, but NIDP has not said whether it kept that. The library checks only length and pattern.

**What the library extracts:** nothing; the number encodes no personal data and is sent to registrants by SMS.

**Caveats:** A Verhoeff check may exist but is not verified.

Sources: https://id.gov.et/, https://en.wikipedia.org/wiki/Fayda_ID

### Ethiopian Taxpayer Identification Number — `ET_TIN`

Issued by: Ministry of Revenues · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 10 digits, often with leading zeros. Example: `0012814908` (the Ministry's own verification example). Branches may carry a sub-TIN suffix such as `-14`.

**Check digit:** None published. The library checks only length and pattern. Strip any sub-TIN suffix before validating.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online; the only source is a third-party validator page.

Sources: https://lookuptax.com/validate/ethiopia/tin

## Finland (FI)

### Finnish Personal Identity Code — `FI_HETU`

Issued by: Digital and Population Data Services Agency (DVV) · Holders: people in the Finnish population register · Check digit: mod 31 character · Confidence: high

**Format:** 11 characters, `DDMMYY C NNN Q`. Example: `131052-308T`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth |
| `C` | Century sign: `+` 1800s; `-`, `Y`, `X`, `W`, `V`, `U` 1900s; `A`, `B`, `C`, `D`, `E`, `F` 2000s |
| `NNN` | Individual number 002–899; odd male, even female (900–999 are temporary numbers) |
| `Q` | Check character |

**Check digit:** Join `DDMMYY` and `NNN` into a 9-digit integer, take it mod 31, and look up `0123456789ABCDEFHJKLMNPRSTUVWXY`. 131052308 mod 31 = 25 → `T`. The century sign is not part of the calculation. The extra century letters were added from 2023 because some dates had run out of numbers; the first `Y` code was issued in late 2023.

**What the library extracts:** date of birth, age, gender, individual number, century sign.

**Caveats:** The library rejects future dates, impossible dates, individual numbers 000/001, and the temporary range 900–999, all of which at least one upstream accepted.

Sources: https://dvv.fi/en/personal-identity-code, https://valtioneuvosto.fi/en/-/10623/availability-of-sufficient-personal-identity-codes-to-be-ensured-using-new-intermediate-characters, https://en.wikipedia.org/wiki/National_identification_number#Finland

### Finnish Business ID — `FI_YTUNNUS`

Issued by: Finnish Patent and Registration Office and Tax Administration (YTJ) · Holders: companies and other businesses · Check digit: weighted mod 11 · Confidence: high

**Format:** 7 digits + check digit, written `NNNNNNN-C`. Example: `0112038-9`.

**Check digit:** Multiply the 7 digits by 7, 9, 10, 5, 8, 4, 2; r = sum mod 11. Check = 0 if r = 0; r = 1 is never issued; otherwise 11 − r. For `0112038`: 0+9+10+10+0+12+16 = 57, r = 2, check = 9.

**What the library extracts:** nothing beyond validity.

Sources: https://www.ytj.fi/en/index/businessid.html, https://en.wikipedia.org/wiki/VAT_identification_number

### Finnish VAT Number — `FI_VAT`

Issued by: Finnish Tax Administration (Vero) · Holders: VAT-registered businesses · Check digit: Y-tunnus rule · Confidence: high

**Format:** `FI` + the 8 digits of the Y-tunnus without the hyphen. Example: `FI01120389`.

**Check digit:** Same as the Y-tunnus, applied to the 8 digits.

**What the library extracts:** nothing beyond validity.

Sources: https://www.vero.fi/en/businesses-and-corporations/taxes-and-charges/vat/, https://ec.europa.eu/taxation_customs/vies/

## Fiji (FJ)

### Fijian Taxpayer Identification Number — `FJ_TIN`

Issued by: Fiji Revenue and Customs Service (FRCS) · Holders: individuals and entities registered in the old tax system · Check digit: weighted mod 10 (reverse-engineered) · Confidence: low

**Format:** 9 digits, no dashes, `TT SSSSSS C`. Example: `500123452`.

| Part | Meaning |
|---|---|
| `TT` | Registration type: 01–26 individual, 30 partnership, 40 shipping and insurance, 50 company, 60 non-profit, 70 estate, 75 trust, 80 co-operative, 90 government |
| `SSSSSS` | Sequence |
| `C` | Check digit |

**Check digit:** Multiply the first 8 digits by 3,1,3,1,3,1,3,1 and take the sum mod 10. For `50012345`: 15+0+0+1+6+3+12+5 = 42, check = 2.

**What the library extracts:** taxpayer type, serial.

**Caveats:** FRCS does not publish the check digit. The library's authors derived it and confirmed it on 720 of 724 TINs in an FRCS public notice (the other 4 look like typos) and on real company TINs, but it remains reverse-engineered. Prefixes outside the table are rejected.

Sources: https://frcs.org.fj/?p=28371, https://www.frcs.org.fj/wp-content/uploads/2018/12/FRCS-4-Pages-.pdf, https://www.usp.ac.fj/finance-unit/wp-content/uploads/sites/59/2025/07/Blanket-Tax-Clearance-Certificate-2025.pdf

### Fijian Taxpayer Identification Number (TPOS) — `FJ_TIN_TPOS`

Issued by: Fiji Revenue and Customs Service (FRCS), Taxpayer Online Services · Holders: individuals and entities registered through TPOS · Check digit: none known · Confidence: high

**Format:** 10 digits, always starting `29`, whatever the registration type. Example: `2900012345`.

**Check digit:** None published, and no real TPOS TINs were found to test against. The library checks only length and the `29` prefix.

**What the library extracts:** the 8 digits after `29` as serial.

Sources: https://frcs.org.fj/?p=28371

## Faroe Islands (FO)

### Faroese Personal Identification Number — `FO_PTAL`

Issued by: National Registration Office (Civil Registration System Act 41/2007) · Holders: people born in or resident in the Faroes, and people taxable there; also the individual TIN · Check digit: one digit, algorithm not published · Confidence: high

**Format:** 9 digits, `DDMMYY-XXX`. Example: `150385-124`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth; century not encoded |
| `XXX` | Serial; the last digit is the check digit and also gives the sex (odd male, even female) |

**Check digit:** The Faroese OECD TIN sheet says the last digit is a check digit but does not give the algorithm, so the library does not verify it.

**What the library extracts:** date of birth (latest century giving a past date), age, gender, serial.

**Caveats:** Non-residents taxable in the Faroes get a separate identification number from TAKS, "similar, but not identical" to the P-tal; its format isn't published and it isn't covered.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Faroe-Islands-TIN.pdf, https://www.taks.fo/en/individuals/tax/p-tal

## France (FR)

### French Social Security Number — `FR_NIR`

Issued by: INSEE (Répertoire national d'identification des personnes physiques) · Holders: people born in France or registered with French social security · Check digit: 97 − mod 97 · Confidence: high

**Format:** 15 characters, `S YY MM LLLLL OOO KK`. Example: `1 85 05 78 006 084 91`.

| Part | Meaning |
|---|---|
| `S` | Sex: 1 male, 2 female; 3/4 and 7/8 are provisional numbers (odd male, even female) |
| `YY` | Last two digits of the birth year; century not encoded |
| `MM` | Birth month 01–12, or a fictitious value 20–42 / 50–99 when unknown |
| `LLLLL` | Birthplace: département (01–95, `2A`/`2B` for Corsica from 1976) + 3-digit commune; `97x`/`98x` overseas + 2-digit commune; `99` + INSEE country code for births abroad; 91–94 Algeria, 95 Morocco, 96 Tunisia for births before independence |
| `OOO` | Order number 001–999 |
| `KK` | Key |

**Check digit:** KK = 97 − (first 13 characters as a number mod 97), with `2A` read as 19 and `2B` as 18. For `1850578006084`: 1850578006084 mod 97 = 6, so KK = 91.

**What the library extracts:** birth year, birth month (when known), gender, birthplace code, commune or birth-country code, order number, provisional flag.

**Caveats:** The library picks the latest past century and does not invent a day. It rejects `2A`/`2B` before 1976, `20` for 1976–1999, and `96` after 1956, which the upstreams accept or reject differently.

Sources: https://www.insee.fr/fr/metadonnees/definition/c1409, https://www.service-public.gouv.fr/particuliers/vosdroits/F33078, https://www.net-entreprises.fr/media/documentation/dsn-identification-des-salaries.pdf, https://fr.wikipedia.org/wiki/Num%C3%A9ro_de_s%C3%A9curit%C3%A9_sociale_en_France

### French Company Identification Number — `FR_SIREN`

Issued by: INSEE (Sirene register) · Holders: companies, sole traders, associations, public bodies · Check digit: Luhn · Confidence: high

**Format:** 9 digits, written `NNN NNN NNN`. Example: `732 829 320`.

**Check digit:** Luhn over all 9 digits. For `732829320` the contributions are 7,6,2,7,2,9,3,4,0 = 40, a multiple of 10.

**What the library extracts:** nothing beyond validity.

Sources: https://www.insee.fr/fr/metadonnees/definition/c2047, https://en.wikipedia.org/wiki/SIREN_code

### French Establishment Identification Number — `FR_SIRET`

Issued by: INSEE (Sirene register) · Holders: each establishment of a SIREN holder · Check digit: Luhn (La Poste: digit sum mod 5) · Confidence: high

**Format:** 14 digits, SIREN + 5-digit establishment number (NIC). Example: `732 829 320 00009`.

**Check digit:** Luhn over all 14 digits, and the first 9 must also pass Luhn as a SIREN. La Poste's establishments (SIREN 356000000) are an exception: the digit sum of all 14 digits must be a multiple of 5.

**What the library extracts:** the SIREN and the establishment number.

Sources: https://www.insee.fr/fr/metadonnees/definition/c1841, https://fr.wikipedia.org/wiki/Syst%C3%A8me_d%27identification_du_r%C3%A9pertoire_des_%C3%A9tablissements

### French VAT Number — `FR_TVA`

Issued by: Direction générale des Finances publiques (DGFiP) · Holders: VAT-registered businesses · Check digit: 2-character key over the SIREN · Confidence: high

**Format:** `FR` + 2-character key + 9-digit SIREN. Example: `FR 40 303265045`.

**Check digit:** For a numeric key: key = (12 + 3 × (SIREN mod 97)) mod 97. For `303265045`: SIREN mod 97 = 74, (12 + 222) mod 97 = 40. The SIREN itself must pass Luhn (except La Poste). Newer numbers can have alphanumeric keys whose rule isn't public; for those only the SIREN is checked.

**What the library extracts:** the SIREN and whether the key was verified.

Sources: https://www.impots.gouv.fr/professionnel/questions/comment-obtenir-un-numero-de-tva-intracommunautaire, https://ec.europa.eu/taxation_customs/vies/

## United Kingdom (GB)

### UK National Insurance Number — `GB_NINO`

Issued by: HM Revenue & Customs / Department for Work and Pensions · Holders: UK residents (issued around age 16, or on starting work) · Check digit: none known · Confidence: high

**Format:** 2 prefix letters + 6 digits + suffix letter, written `AB 12 34 56 C`. Example: `AB123456C`.

| Part | Meaning |
|---|---|
| Prefix | Two letters; D, F, I, Q, U, V never used, O never second; BG, GB, KN, NK, NT, TN, ZZ never allocated |
| `NNNNNN` | Six digits |
| Suffix | Always A, B, C or D |

**Check digit:** None. The library checks the letter rules above and rejects FY, NC, PY, PZ, which are administrative/temporary references, not NINOs.

**What the library extracts:** prefix, number, suffix.

**Caveats:** The suffix does not encode birth order. HMRC releases new prefixes from time to time (it confirmed HN as valid), so a prefix allowed by the rules may still be unallocated.

Sources: https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110, https://en.wikipedia.org/wiki/National_Insurance_number

### NHS Number — `GB_NHS`

Issued by: NHS England (also NHS Wales, Isle of Man); Scottish CHI and Northern Ireland H&C numbers share the scheme · Holders: patients · Check digit: weighted mod 11 · Confidence: high

**Format:** 10 digits, written `NNN NNN NNNN`. Example: `943 476 5919`.

**Check digit:** Multiply the first 9 digits by 10, 9, …, 2 and sum; check = 11 − (sum mod 11), with 11 written as 0. A result of 10 is never issued. For `943476591`: sum 299, 299 mod 11 = 2, check = 9.

**What the library extracts:** which range the number falls in: Scotland CHI (0101010000–3112999999), Northern Ireland H&C (3200000000–3999999999), or England/Wales/Isle of Man.

Sources: https://www.datadictionary.nhs.uk/attributes/nhs_number.html, https://www.ndc.scot.nhs.uk/Dictionary-A-Z/Definitions/index.asp?ID=128, https://en.wikipedia.org/wiki/NHS_number

### UK Unique Taxpayer Reference — `GB_UTR`

Issued by: HM Revenue & Customs · Holders: individuals in Self Assessment, companies (Corporation Tax), partnerships, trusts · Check digit: weighted mod 11, first digit · Confidence: moderate

**Format:** 10 digits, written `NNNNN NNNNN`. Example: `92345 67891`. HMRC sometimes prints a trailing `K`, which isn't part of the number.

**Check digit:** The first digit checks the other nine. Multiply digits 2–10 by 6, 7, 8, 9, 10, 5, 4, 3, 2; r = sum mod 11; the check digit is `21987654321`[r] (so 0 → 2, 1 → 1, otherwise 11 − r). For `234567891`: sum 266, r = 2, check = 9.

**What the library extracts:** nothing beyond validity.

**Caveats:** HMRC does not publish the algorithm. A Sage worked example (`3282497350`) matches it; a spreadsheet formula on AccountingWeb maps remainders 0 and 1 differently. nationid mapped 0 → 0 and rejected 1; the library uses 0 → 2, 1 → 1.

Sources: https://www.gov.uk/find-utr-number, https://www.accountingweb.co.uk/any-answers/check-digit-for-utr, https://help.sbc.sage.com/en-gb/control-centre-dt/D/CCentreUnique_Taxpayer_Reference.html

### UK VAT Registration Number — `GB_VAT`

Issued by: HM Revenue & Customs · Holders: VAT-registered businesses · Check digit: mod 97 (two schemes) · Confidence: high

**Format:** `GB` + 9 digits, optionally + 3-digit branch; or `GBGD` + 3 digits (government departments, 000–499) / `GBHA` + 3 digits (health authorities, 500–999). `XI` replaces `GB` for Northern Ireland under the Windsor Framework. Example: `GB980780684`.

**Check digit:** Multiply the first 7 digits by 8, 7, 6, 5, 4, 3, 2, add the last two digits as a number. The total must be ≡ 0 mod 97 (original scheme) or ≡ 42 mod 97 (the "9755" scheme for newer numbers). For `980780684`: 207 + 84 = 291 = 3 × 97, valid.

**What the library extracts:** prefix (GB/XI), scheme, branch, or kind (government / health authority) for GD/HA numbers.

Sources: https://www.gov.uk/guidance/vat-registration-numbers, https://www.gov.uk/government/publications/vat-notice-7001-should-i-be-registered-for-vat, https://en.wikipedia.org/wiki/VAT_identification_number

## Grenada (GD)

### Grenada Taxpayer Identification Number — `GD_TIN`

Issued by: Inland Revenue Division · Holders: entities (automatically), and individuals liable to file a return or pay direct tax · Check digit: none known · Confidence: moderate

**Format:** 6 digits. Example: `123456`.

**Check digit:** None. Grenada's OECD TIN sheet says: "There is no TIN structure other than the issuing of a six (6) digit unique number." The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/grenada-tin.pdf

## Georgia (GE)

### Georgian Personal Number — `GE_PN`

Issued by: Public Service Development Agency (Public Registry) · Holders: citizens; also their TIN · Check digit: none known · Confidence: moderate

**Format:** 11 digits. Example: `01001012345`.

**Check digit:** None published, and no internal structure is published. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/georgia-tin.pdf, https://www.rs.ge/5385, https://en.wikipedia.org/wiki/National_identification_number#Georgia

### Georgian Taxpayer Identification Code — `GE_TIN`

Issued by: National Agency of Public Registry (entities) and Revenue Service (other taxpayers) · Holders: entities and non-citizen individuals · Check digit: none known · Confidence: moderate

**Format:** 9 digits, starting with a legal-form code. Example: `204123456`.

| Part | Meaning |
|---|---|
| First digit | Legal-form code: 1 or 3 physical persons / individual entrepreneurs (foreigners); 2 or 4 enterprises and other legal persons |
| Rest | Number assigned by the Revenue Service |

**Check digit:** None published. The library checks length and that the first digit is 1–4.

**What the library extracts:** legal-form code and whether it is an individual or legal entity.

**Caveats:** The OECD sheet describes the code as "seven digits … and the codes of the taxpayer's legal forms" without saying where the code sits or what the remaining digit is; the library assumes the code is the first digit. idnumbers labels this 9-digit code Georgia's "personal number"; the library models it separately from the 11-digit citizen number.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/georgia-tin.pdf, https://www.rs.ge/5385

## Guernsey (GG)

### Guernsey Social Insurance Number — `GG_SSN`

Issued by: Guernsey Revenue Service · Holders: individuals, at birth in the Bailiwick or on taking up residence; used as the individual TIN · Check digit: none known · Confidence: high

**Format:** `GY` + 6 digits, issued sequentially. Example: `GY 123456`.

**Check digit:** None. The library checks only the `GY` prefix and length.

**What the library extracts:** the 6-digit serial.

**Caveats:** A small group who moved to Guernsey before 1979 kept a UK National Insurance number or Jersey social security number (`JY` + 6 digits + letter), which remain valid Guernsey TINs; those are validated by `GB_NINO` / `JE_SSN`.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Guernsey-TIN.pdf

### Guernsey Tax Reference Number (entities) — `GG_TRN`

Issued by: Guernsey Revenue Service · Holders: companies tax resident in Guernsey but not incorporated there; partnerships registered outside Guernsey but tax resident there · Check digit: none known · Confidence: high

**Format:** a digit, 1 letter (company) or 2 letters (partnership), 6 digits, and usually (not always) a letter suffix. Examples: `1C 123456 / O` (company), `1PP 123456 / F` (partnership).

| Part | Meaning |
|---|---|
| `1C` / `1PP` | Prefix: a digit plus one letter (company) or two letters (partnership); meaning not published |
| `123456` | 6 digits |
| `O` / `F` | Optional letter suffix; meaning not published |

**Check digit:** None published. The library checks only the shape.

**What the library extracts:** kind (`company` or `partnership`, from the letter count), prefix, the 6-digit serial, and the suffix when present.

**Caveats:** The other entity TINs on the sheet are not modelled because they are too generic to validate: Guernsey company registration numbers (1–6 digits, sequential), foundation numbers (1–3 digits), charity numbers (`CH` + 1–3 digits) and NPO numbers (`NP` + 1–3 digits). Trusts have no TIN and report `NOTIN`.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Guernsey-TIN.pdf

## Ghana (GH)

### Ghana Card Personal Identification Number — `GH_PIN`

Issued by: National Identification Authority (NIA) · Holders: citizens (Ghana Card) and foreign permanent residents (Non-Citizen Card); the TIN for eligible individuals since 1 April 2021 · Check digit: one character, algorithm not published · Confidence: high

**Format:** `CCC-NNNNNNNNN-K`, 15 characters with hyphens (14 when the number has 8 digits). Example: `GHA-123456789-0`.

| Part | Meaning |
|---|---|
| `CCC` | ISO 3166 alpha-3 code of the holder's nationality at first registration (`GHA` for citizens) |
| `NNNNNNNNN` | 8- or 9-digit system-generated number |
| `K` | Check character, digit or letter |

**Check digit:** NIA uses it internally when creating PINs but has not published the algorithm. The library does not verify it.

**What the library extracts:** serial and `nationalityAtRegistration`. It does not infer current citizenship, because the PIN does not change if nationality changes. Unknown country codes are rejected.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ghana-TIN.pdf, https://nia.gov.gh/the-ghanacard-introduction/, https://lookuptax.com/validate/ghana/tin

### Ghana Revenue Authority Taxpayer Identification Number — `GH_TIN`

Issued by: Ghana Revenue Authority (GRA) · Holders: organisations, non-resident individuals, foreign-mission staff, and individuals not eligible for the Ghana Card · Check digit: final character, algorithm not published · Confidence: moderate

**Format:** 11 characters, 3-character prefix + 7 digits + check character. Example: `C0001234560`.

| Prefix | Meaning |
|---|---|
| `P00` | Individuals |
| `C00` | Companies registered with the Registrar General's Department |
| `G00` | Government agencies, MDAs |
| `Q00` | Foreign missions and their employees |
| `V00` | Public institutions, trusts, co-operatives, offshore and other entities not registered with the RGD |

**Check digit:** LookupTax reports the last character as a digit or `X`, which suggests mod 11, but the weights are not published. The library checks only the pattern.

**What the library extracts:** taxpayer type, serial.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ghana-TIN.pdf, https://lookuptax.com/validate/ghana/tin

## Guinea (GN)

### Guinean Permanent Tax Identification Number — `GN_NIFP`

Issued by: Direction Nationale des Impôts (DNI) · Holders: individuals and companies · Check digit: Luhn · Confidence: high

**Format:** 9 digits, written `NNN-NNN-NNN`. Example: `693-770-885`.

**Check digit:** The first 8 digits are pseudo-random; the 9th is a Luhn check digit (DNI functional specification for the NIFp, 30 November 2018, §8). For `693770885` the Luhn contributions are 6,9,3,5,7,0,8,7,5 = 50, a multiple of 10.

**What the library extracts:** the 8-digit body as serial.

**Caveats:** The DNI specification is a scanned image and was not re-read for this document; the rule is confirmed against the published example. Establishment numbers (NIFp + sequence + new key) and the 18-character NPI are not covered because their layouts aren't fully published.

Sources: https://dgi.gov.gn/wp-content/uploads/2022/09/N%C2%B0-12-Cahier-de-Charges-NIF-p.pdf, https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.gn.nifp

## Greece (GR)

### Greek Tax Identification Number — `GR_VAT`

Issued by: Independent Authority for Public Revenue (AADE) · Holders: individuals and entities; also the VAT number · Check digit: powers-of-2 mod 11 · Confidence: high

**Format:** 9 digits (ΑΦΜ). On VIES the prefix is `EL`, not `GR`. Example: `123456783`.

**Check digit:** Multiply the first 8 digits by 256, 128, 64, 32, 16, 8, 4, 2 (2⁸ … 2¹), sum, take mod 11, then mod 10. For `12345678`: sum 1004, 1004 mod 11 = 3, check = 3.

**What the library extracts:** nothing beyond validity. `EL`/`GR` prefixes are dropped; `000000000` (passes the check, never issued) is rejected.

Sources: https://www.aade.gr/, https://ec.europa.eu/taxation_customs/vies/, https://en.wikipedia.org/wiki/VAT_identification_number

### Greek Social Security Number — `GR_AMKA`

Issued by: AMKA register (ΗΔΙΚΑ), Law 2084/1992 art. 64 and Law 3655/2008 · Holders: everyone insured or living in Greece · Check digit: Luhn · Confidence: moderate

**Format:** 11 digits, `DDMMYY SSSS C`. Example: `010180 1234 2`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth; century not encoded |
| `SSSS` | Serial; the last digit is odd for men, even for women |
| `C` | Luhn check digit |

**Check digit:** Luhn over all 11 digits. For `01018012342` the contributions are 0,2,0,2,8,0,1,4,3,8,2 = 30, a multiple of 10.

**What the library extracts:** date of birth (latest century giving a past date), age, gender, serial.

**Caveats:** One secondary source (Microsoft Purview) lists the date as YYMMDD; the PHP and python validators, and the library, read DDMMYY.

Sources: https://www.amka.gr/, https://el.wikipedia.org/wiki/%CE%91%CF%81%CE%B9%CE%B8%CE%BC%CF%8C%CF%82_%CE%9C%CE%B7%CF%84%CF%81%CF%8E%CE%BF%CF%85_%CE%9A%CE%BF%CE%B9%CE%BD%CF%89%CE%BD%CE%B9%CE%BA%CE%AE%CF%82_%CE%91%CF%83%CF%86%CE%AC%CE%BB%CE%B9%CF%83%CE%B7%CF%82

### Greek Identity Card Number — `GR_ADT`

Issued by: Hellenic Police · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 1 or 2 Greek capital letters + 6 digits. Two letters on cards issued since 2000, one on older cards. Example: `ΑΒ 123456`.

**Check digit:** None. The library checks only the pattern.

**What the library extracts:** serial, and `kind` (current two-letter vs old one-letter card). Latin lookalike letters (A, B, E, Z, H, I, K, M, N, O, P, T, Y, X) are mapped to Greek so a card has one normalised form.

**Caveats:** Not re-verified online.

Sources: https://www.astynomia.gr/, https://en.wikipedia.org/wiki/Greek_identity_card

## Guatemala (GT)

### Guatemalan Personal Identification Document — `GT_DPI`

Issued by: Registro Nacional de las Personas (RENAP), Decreto 90-2005 · Holders: citizens and resident foreigners · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 13 digits, `NNNNNNNN V DD MM`, displayed `NNNN NNNNN NNNN` (grouping does not follow the fields). Example: `1912 34567 1230`.

| Part | Meaning |
|---|---|
| `NNNNNNNN` | Correlativo, assigned by RENAP; no personal data |
| `V` | Check digit |
| `DD` | Department, 01–22 (of birth for nationals; of DPI registration for naturalised citizens and residents) |
| `MM` | Municipality within the department (340 in total since 2015) |

**Check digit:** Multiply the 8 correlativo digits by 2, 3, 4, …, 9 (left to right) and take the sum mod 11; the remainder is the check digit, and 10 is never issued. For `19123456`: 2+27+4+10+18+28+40+54 = 183, 183 mod 11 = 7.

**What the library extracts:** department + municipality code, department name, correlativo.

**Caveats:** RENAP confirms the 9th digit is a verifier but does not publish the algorithm; the rule comes from validator libraries. Municipality codes above the department's count are rejected.

Sources: https://www.renap.gob.gt/, https://www.congreso.gob.gt/assets/uploads/info_legislativo/decretos/2005/gtdcx90-2005.pdf, https://es.wikipedia.org/wiki/Anexo:Municipios_de_Guatemala, https://learn.sayari.com/interpreting-guatemalan-national-id-numbers/

### Guatemalan Tax Identification Number — `GT_NIT`

Issued by: Superintendencia de Administración Tributaria (SAT) · Holders: individuals and entities · Check digit: weighted mod 11, `K` for 10 · Confidence: moderate

**Format:** 1–12 digit body + check character, written `BODY-C`. Example: `1234567-9`.

**Check digit:** Multiply the body digits by 2, 3, 4, … starting from the rightmost digit; check = (11 − sum mod 11) mod 11, with 10 written `K`. For `1234567`: 7·2+6·3+5·4+4·5+3·6+2·7+1·8 = 112, 112 mod 11 = 2, check = 9.

**What the library extracts:** nothing beyond validity. Repeated-digit bodies are rejected as placeholders.

**Caveats:** Not re-verified online.

Sources: https://portal.sat.gob.gt/portal/, https://portal.sat.gob.gt/portal/consulta-cui-nit/

### Guatemalan Passport Number — `GT_PASAPORTE`

Issued by: Instituto Guatemalteco de Migración (IGM) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 8 or 9 letters/digits. Example: `G12345678`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online; the pattern is loose.

Sources: https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/

## Hong Kong (HK)

### Hong Kong Identity Card Number — `HK_HKID`

Issued by: Immigration Department · Holders: Hong Kong residents (card required from age 11) · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 1 or 2 letters + 6 digits + check character, written `A123456(3)`. Example: `A1234563`.

| Part | Meaning |
|---|---|
| Prefix | 1–2 letters reflecting when and where the card was first issued |
| `NNNNNN` | Six digits |
| Check | Digit 0–9 or `A` |

**Check digit:** Letters count A = 10 … Z = 35; a one-letter prefix is padded with a leading space worth 36. Multiply the 8 positions by 9, 8, …, 2 and sum; check = (11 − sum mod 11) mod 11, with 10 written `A`. For `A123456`: 36·9 + 10·8 + 1·7 + 2·6 + 3·5 + 4·4 + 5·3 + 6·2 = 481, 481 mod 11 = 8, check = 3.

**What the library extracts:** prefix, serial, check character. No birth date or gender is encoded.

**Caveats:** The government has never published the algorithm; it comes from widely shared descriptions, and some older sources give variants. The library normalises lowercase, full-width characters and unbalanced brackets instead of rejecting them.

Sources: https://www.immd.gov.hk/eng/services/hkid/smartid.html, https://en.wikipedia.org/wiki/Hong_Kong_identity_card

## Honduras (HN)

### Honduran National Identity Number — `HN_DNI`

Issued by: Registro Nacional de las Personas (RNP) · Holders: citizens (card from age 18) · Check digit: none known · Confidence: moderate

**Format:** 13 digits, `DDMM-YYYY-NNNNN`. Example: `0801-1990-12345`.

| Part | Meaning |
|---|---|
| `DD` | Department of birth, 01–18 |
| `MM` | Municipality of birth within the department (298 in total) |
| `YYYY` | Year the birth was registered with the RNP; usually the birth year, sometimes one year later |
| `NNNNN` | Entry in the birth register (volume and folio) |

**Check digit:** None published. The library checks the department range, the municipality count per department, and that the year is not in the future.

**What the library extracts:** registration year (as `extra.registrationYear`), department + municipality code, department name, serial.

**Caveats:** Sayari describes `YYYY` as the year the birth was filed with the RNP, which can differ from the birth year, so the library does not report a `birthYear` or age. Sayari gives `DDMM` as the department and municipality of birth.

Sources: https://www.rnp.hn/, https://en.wikipedia.org/wiki/Municipalities_of_Honduras, https://learn.sayari.com/interpreting-honduran-national-id-numbers/

### Honduran National Tax Registry Number — `HN_RTN`

Issued by: Servicio de Administración de Rentas (SAR) · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 14 digits, written `NNNN-NNNN-NNNNNN`. For individuals it is the DNI plus one digit; companies get a SAR-assigned number. Example: `0801-1990-123456`.

**Check digit:** None published. The library checks only length and pattern, and rejects repeated-digit placeholders.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.sar.gob.hn/

### Honduran Passport Number — `HN_PASAPORTE`

Issued by: Instituto Nacional de Migración (INM) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** optional letter + 7–9 digits. Example: `123456789`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online; the pattern is loose.

Sources: https://inm.gob.hn/, https://en.wikipedia.org/wiki/Honduran_passport

## Croatia (HR)

### Croatian Personal Identification Number — `HR_OIB`

Issued by: Tax Administration (Porezna uprava) · Holders: citizens, foreigners with a link to Croatia, legal entities · Check digit: ISO/IEC 7064 MOD 11,10 · Confidence: high

**Format:** 11 digits: ten random digits and a check digit. Example: `12345678903`. The EU VAT number is `HR` + the OIB. The library strips the `HR` prefix.

**Check digit:** Start with p = 10. For each of the first ten digits: s = (p + digit) mod 10, and if s = 0 use 10; then p = (2·s) mod 11. The check digit is (11 − p) mod 10. For `1234567890` the successive p values are 2, 8, 2, 1, 1, 3, 9, 3, 4, 8, so the check digit is 11 − 8 = 3, giving `12345678903`.

**What the library extracts:** nothing. The number encodes nothing about the holder, so the library confirms it is valid and returns no fields.

Sources: https://narodne-novine.nn.hr/clanci/sluzbeni/2008_05_60_2033.html, https://narodne-novine.nn.hr/clanci/sluzbeni/2009_01_1_6.html, https://www.porezna-uprava.hr/en/Pages/PIN.aspx, https://en.wikipedia.org/wiki/Personal_identification_number_(Croatia)

### Croatian Master Citizen Number (pre-2009) — `HR_JMBG`

Issued by: civil registry (former Yugoslav system; Zakon o matičnom broju, NN 9/1992) · Holders: citizens and registered residents · Check digit: weighted mod 11 · Confidence: high · Deprecated

**Format:** 13 digits, `DD MM YYY RR BBB K`. Example: `0101990330000`.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth; `YYY` is the last three digits of the year (9xx → 19xx, 0xx → 20xx, 8xx → 18xx) |
| `RR` | Register region of first registration; 30–39 are Croatian (33 = Zagreb) |
| `BBB` | Serial: 000–499 male, 500–999 female |
| `K` | Check digit |

**Check digit:** Multiply the first 12 digits by 7,6,5,4,3,2,7,6,5,4,3,2 and sum. Let m = 11 − (sum mod 11). If m is 1–9, K = m; if m = 11, K = 0. If m = 10, the library follows the common rule that K = 0. For `010199033000` the sum is 88 and 88 mod 11 = 0, so K = 0.

**What the library extracts:** date of birth, age, gender, region code and name, serial.

**Caveats:** The OIB replaced the JMBG in 2009, but older documents still show it. People who moved between the Yugoslav republics before 1991 kept their numbers, so the library accepts every allocated region code, not only 30–39. The JMBG engine is shared with Serbia (`RS_JMBG`).

Sources: https://www.zakon.hr/cms.htm?id=35567, https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number, https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345

## Haiti (HT)

### Haitian Tax Identification Number — `HT_NIF`

Issued by: Direction Générale des Impôts (since 1987) · Holders: individuals and legal persons · Check digit: one exists, but the algorithm is unpublished · Confidence: moderate

**Format:** 10 digits. Example: `1234567890`.

**Check digit:** The last digit is a check digit, according to an ONI/DGI statement quoted by Canada's IRB in response 451717. The algorithm has not been published, so the library checks only length and pattern.

**What the library extracts:** nothing.

**Caveats:** The NINU is replacing the NIF. Passports already use the NINU in place of the NIF.

Sources: https://www.irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=451717, https://fr.wikipedia.org/wiki/Num%C3%A9ro_d'immatriculation_fiscale, https://www.haitidocs.org/doc/mef-decret-numero-immatriculation-fiscale

### Haitian Unique National Identification Number — `HT_NINU`

Issued by: Office National d'Identification (ONI) · Holders: persons, assigned from birth · Check digit: none known · Confidence: low

**Format:** 10 digits. Example: `1234567890`.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** nothing.

**Caveats:** The 2017 bill says the NINU uses the same coding structure as the NIF, and that existing NIF holders receive a NINU identical to their NIF. The ONI describes the new number as 10 digits, and iciHaiti reports the same in its article on passports switching from the NIF to the NINU. The ONI said every child born in Haiti would be assigned a NINU automatically from the first quarter of 2026. Its internal structure is unpublished. Le Nouvelliste reports a June 2020 decree, while the module cites a decree of 11 March 2020; the exact legal basis was not re-verified.

Sources: https://www.ecoi.net/en/document/2137260.html, https://www.ecoi.net/en/document/2137253.html, https://www.lenational.org/article/politique/7452/les-modalites-dapplication-du-numero-didentification-nationale-unique-et-de-la-carte-didentification-nationale-fixees, https://www.icihaiti.com/en/news-46606-icihaiti-flash-passport-haiti-switches-from-nif-to-ninu.html, https://lenouvelliste.com/en/article/262533/reforme-de-letat-civil-loni-mise-sur-le-ninu

### Haitian National Identity Card Number — `HT_CIN`

Issued by: Office National d'Identification (ONI) · Holders: adult citizens · Check digit: none known · Confidence: low · Deprecated

**Format:** first generation: 17 digits, `DD-CC-PP-YYYY-MM-NNNNN`. Example: `01-05-99-1985-03-00123`. Second generation (from December 2014): 14 digits.

| Part | Meaning |
|---|---|
| `DD` | Department (01 Ouest and 07 Sud are confirmed) |
| `CC` | Commune |
| `PP` | Country code: 99 = Haiti, 00 = Dominican Republic |
| `YYYY` | Year of birth |
| `MM` | Month of birth |
| `NNNNN` | Registration serial |

**Check digit:** None known. For 17-digit numbers the library rejects a month above 12 or a birth month in the future. For 14-digit numbers it checks length only.

**What the library extracts:** for the first generation: birth year and month, department code (named only for 01 and 07), commune, country code and name, serial, and generation. For the second generation: generation only.

**Caveats:** The layout comes from ONI statements reported by Canada's IRB in 2010 and 2015, not from an ONI specification. The second-generation layout is in an ONI annex the library's authors could not read. The NINU replaces both card numbers.

Sources: https://www.ecoi.net/en/document/2137260.html, https://www.irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=455932&pls=1, https://www.ecoi.net/en/document/2137253.html

## Hungary (HU)

### Hungarian Personal Identification Number — `HU_SZEMELYI_SZAM`

Issued by: personal data and address register (1996. évi XX. törvény, Annex 3) · Holders: citizens and registered residents · Check digit: weighted mod 11 · Confidence: high

**Format:** 11 digits, `M YYMMDD SSS K`. Example: `1-800101-0016`.

| Part | Meaning |
|---|---|
| `M` | Born before 1997: 1/2 Hungarian, 1900s (male/female); 3/4 Hungarian, 1800s; 5/6 non-Hungarian, 1900s; 7/8 non-Hungarian, 1800s. Born from 1997: 1/2 for 1997–1999, 3/4 from 2000; citizenship not encoded |
| `YYMMDD` | Date of birth |
| `SSS` | Serial for people born on the same day |
| `K` | Check digit |

**Check digit:** Multiply the first ten digits by weights and sum; K is the sum mod 11. For people born before 1997 the weights are 1,2,…,10 from the left. For people born from 1997 the weights are reversed (10,…,1); the change was made because the old weights missed swaps of the last two digits. A remainder of 10 is never issued. For `1800101001` (weights 1–10) the sum is 39, and 39 mod 11 = 6.

**What the library extracts:** date of birth, age, gender, serial, and citizenship (pre-1997 numbers only).

**Caveats:** M = 3/4 can mean the 1800s (old weights) or the 2000s (new weights). The library lets the check digit decide and prefers 20YY. It also rejects M = 5/6 with a birth year of 1997–1999, because no citizenship marker was used after 1996.

Sources: https://njt.jog.gov.hu/jogszabaly/1996-20-00-00, https://hu.wikipedia.org/wiki/Szem%C3%A9lyi_azonos%C3%ADt%C3%B3

### Hungarian Personal Tax Identification Number — `HU_ADOAZONOSITO`

Issued by: National Tax and Customs Administration (NAV) · Holders: individuals · Check digit: weighted mod 11 · Confidence: high

**Format:** 10 digits, `8 NNNNN SSS K` (Annex 1 of the 1996 law). Example: `8412721233`.

| Part | Meaning |
|---|---|
| `8` | Fixed first digit |
| `NNNNN` | Number of days from 1867-01-01 to the date of birth |
| `SSS` | Serial |
| `K` | Check digit |

**Check digit:** Multiply the first nine digits by 1,2,…,9 and sum; K is the sum mod 11. A remainder of 10 is never issued. For `841272123` the sum is 124, and 124 mod 11 = 3. Day count 41272 is 1980-01-01.

**What the library extracts:** date of birth, age, serial.

Sources: https://njt.jog.gov.hu/jogszabaly/1996-20-00-00, https://nav.gov.hu/ugyintezes/adoazonosito_jel

### Hungarian Social Security Number — `HU_TAJ`

Issued by: National Health Insurance Fund (NEAK) · Holders: insured persons · Check digit: weighted mod 10 · Confidence: high

**Format:** 9 digits: an 8-digit running number and a check digit, written `123 456 788`.

**Check digit:** Multiply digits in odd positions by 3 and digits in even positions by 7, over the first eight digits. The check digit is the sum mod 10. For `12345678` the sum is 188, so the check digit is 8.

**What the library extracts:** serial (the first eight digits).

Sources: https://njt.jog.gov.hu/jogszabaly/1996-20-00-00, https://hu.wikipedia.org/wiki/T%C3%A1rsadalombiztos%C3%ADt%C3%A1si_azonos%C3%ADt%C3%B3_jel

### Hungarian VAT Number — `HU_VAT`

Issued by: National Tax and Customs Administration (NAV) · Holders: VAT-registered persons and entities · Check digit: weighted mod 10 · Confidence: high

**Format:** `HU` + 8 digits (the core of the domestic tax number). Example: `HU12345676`. The library adds the `HU` prefix to bare 8-digit input.

**Check digit:** Multiply the eight digits by 9,7,3,1,9,7,3,1. The total must be divisible by 10. For `12345676` the total is 150.

**What the library extracts:** nothing beyond validity.

Sources: https://nav.gov.hu/, https://ec.europa.eu/taxation_customs/vies/

## Indonesia (ID)

### Indonesian Population Identification Number — `ID_NIK`

Issued by: Directorate General of Population and Civil Registration (Dukcapil), Ministry of Home Affairs · Holders: residents, citizens and registered foreigners · Check digit: none · Confidence: high

**Format:** 16 digits, `PP KK CC DDMMYY SSSS`. Example: `317405 410190 0001`.

| Part | Meaning |
|---|---|
| `PP` | Province code (e.g. 31 DKI Jakarta) |
| `KK` | Regency (01–69) or city (71–99) |
| `CC` | District (kecamatan) where the NIK was first issued |
| `DD` | Day of birth; women add 40 |
| `MMYY` | Month and two-digit year of birth; century not encoded |
| `SSSS` | Serial 0001–9999 |

**Check digit:** None. The library checks the province against 38 codes (including the 2022 Papua provinces 93–96), rejects regency or district 00, and validates the date.

**What the library extracts:** date of birth (latest past century), age, gender, province code and name, regency and district codes, serial. For example, `3174054101900001` is a woman born 1 January 1990 in Jakarta Selatan.

**Caveats:** The library does not check district codes against a table, so numbers from newly created districts still validate.

Sources: https://peraturan.bpk.go.id/Details/4782/pp-no-37-tahun-2007, https://www.nu.or.id/nasional/tahukah-anda-arti-16-digit-nomor-ktp-yoXKi, https://dukcapil.kemendagri.go.id/, https://en.wikipedia.org/wiki/Indonesian_identity_card

### Indonesian Taxpayer Identification Number — `ID_NPWP`

Issued by: Directorate General of Taxes (DJP) · Holders: individuals and entities · Check digit: one exists, but the algorithm is unpublished · Confidence: moderate

**Format:** legacy 15 digits, `XX.XXX.XXX.X-XXX.XXX`, or 16 digits. Example: `31.123.456.7-012.000`.

| Part | Meaning |
|---|---|
| `XX` | Taxpayer type |
| `XXX.XXX` | Serial |
| `X` | Check digit (algorithm unpublished) |
| `XXX` | Tax office code |
| `XXX` | Branch status (000 = head office or single taxpayer) |

**Check digit:** DJP does not publish the algorithm, so the library checks only length and pattern. Under PMK 112/PMK.03/2022, resident individuals use their 16-digit NIK as their NPWP. Other taxpayers use the legacy number with a leading 0. The new format applied from 14 July 2022 and became mandatory on 1 January 2024.

**What the library extracts:** taxpayer type, serial, tax office, branch code, and whether the input was the 16-digit form.

**Caveats:** A resident individual's 16-digit NPWP is simply their NIK. The library matches only the `0` + 15-digit form here; an NIK is matched by `ID_NIK`.

Sources: https://www.pajak.go.id/sites/default/files/2022-07/SP-43%202022%20NPWP%20Format%20Baru%20PMK%20112%202022.pdf, https://www.pwc.com/id/en/taxflash/assets/english/2022/taxflash-2022-15.pdf, https://news.ddtc.co.id/npwp-diganti-nik-implementasi-secara-penuh-mulai-1-januari-2024-40664

## Ireland (IE)

### Irish Personal Public Service Number — `IE_PPSN`

Issued by: Department of Social Protection · Holders: individuals (residents, workers, people using public services) · Check digit: weighted mod 23 letter · Confidence: moderate

**Format:** 7 digits, a check letter, and an optional second letter. Example: `1234567T`, `1234567FA`.

| Part | Meaning |
|---|---|
| `NNNNNNN` | Serial |
| check letter | Check character |
| second letter | A or H (and B, per the library) on numbers issued since 2013, where it counts in the check; W, T or X are legacy suffixes that do not count |

**Check digit:** Multiply the seven digits by 8,7,6,5,4,3,2. If the second letter is A, B or H, add 9 × its alphabet position (A = 1, B = 2, H = 8). Take the total mod 23 and map 0 → W, 1 → A, …, 22 → V. For `1234567` the sum is 112, and 112 mod 23 = 20 → `T`. With second letter A: 112 + 9 = 121, and 121 mod 23 = 6 → `F`, giving `1234567FA`.

**What the library extracts:** serial and second letter.

**Caveats:** Sources describe A for individuals and H for non-individuals. Wikipedia says any letter other than W may appear in position 9 from 2013. The library accepts only A, B and H as new-style letters (plus legacy W, T, X); B was not confirmed in the sources reviewed.

Sources: https://www.gov.ie/en/service/12e6dc-get-a-personal-public-service-pps-number/, https://www.revenue.ie/en/jobs-and-pensions/starting-your-first-job/pps-number.aspx, https://en.wikipedia.org/wiki/Personal_Public_Service_Number

### Irish VAT Number — `IE_VAT`

Issued by: Revenue Commissioners · Holders: VAT-registered businesses · Check digit: weighted mod 23 letter · Confidence: moderate

**Format:** `IE` + 8 or 9 characters. The new form is 7 digits, a check letter and an optional A/H second letter (`IE6433435F`). The old pre-2013 company form is a digit, a letter or `+`/`*`, 5 digits and a check letter (`IE1A23456B`).

**Check digit:** The new form uses the same check as the PPSN: for `6433435` the weighted sum mod 23 = 6 → `F`. For the old form, build a 7-digit string from `0`, characters 3–7, then character 1, and apply the same check.

**What the library extracts:** which form the number uses (old or new).

**Caveats:** The library adds the `IE` prefix to bare input that matches either form.

Sources: https://www.revenue.ie/en/vat/vat-registration/index.aspx, https://ec.europa.eu/taxation_customs/vies/, https://en.wikipedia.org/wiki/VAT_identification_number

## Israel (IL)

### Israeli Identity Number — `IL_TZ`

Issued by: Population and Immigration Authority (Ministry of Interior) · Holders: citizens and permanent residents (number assigned at registration; card issued from age 16) · Check digit: Luhn · Confidence: high

**Format:** 9 digits: 8 digits and a check digit. Example: `12345678-2`.

**Check digit:** Working from the left, multiply digits alternately by 1 and 2. Replace any two-digit product by the sum of its digits, then sum everything. The total including the check digit must be divisible by 10; this is the Luhn scheme. For `12345678` the reduced products are 1,4,3,8,5,3,7,7 = 38, so the check digit is 2.

**What the library extracts:** nothing. The number encodes nothing about the holder.

**Caveats:** Older numbers often lose their leading zeros in spreadsheets. The standard check pads to 9 digits, so the library left-pads 5–8 digit input. It rejects `000000000`, which passes Luhn but is never issued.

Sources: https://www.gov.il/en/departments/population_and_immigration_authority, https://he.wikipedia.org/wiki/מספר_זהות, https://en.wikipedia.org/wiki/Israeli_identity_card

## Isle of Man (IM)

### Isle of Man Tax Reference Number — `IM_TRN`

Issued by: Income Tax Division, Isle of Man Treasury · Holders: individuals, partnerships, companies, trusts and foundations that file an Isle of Man return · Check digit: none known · Confidence: moderate

**Format:** one letter, six digits, then an optional hyphen and two-digit suffix. Examples: `H111111-11`, `C222222`.

| Part | Meaning |
|---|---|
| letter | Taxpayer category: H for individuals |
| `NNNNNN` | Serial |
| `-NN` | Optional suffix |

**Check digit:** None. The library checks only length and pattern.

**What the library extracts:** prefix letter, serial, suffix.

**Caveats:** The OECD sheet's text says companies use X, but its examples show a company as `C333333-33` and a trust as `X555555-55`. The library therefore accepts any letter. Individuals may also use a UK-format National Insurance number, which the library validates as `GB_NINO` (IM maps to GB). The Isle of Man states that no construction details or verification tool are available.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Isle-of-Man-TIN.pdf

## India (IN)

### Aadhaar Number — `IN_AADHAAR`

Issued by: Unique Identification Authority of India (UIDAI) · Holders: residents of India · Check digit: Verhoeff · Confidence: high

**Format:** 12 digits, written `2341 2341 2346`. The first digit is 2–9: 0 and 1 are reserved (1 is used by the Virtual ID).

**Check digit:** The Verhoeff algorithm over all 12 digits. Process the digits from the right through the dihedral-group D5 multiplication table, after applying a position-dependent permutation. The result must be 0. The algorithm catches all single-digit errors and adjacent transpositions.

**What the library extracts:** nothing. The number is deliberately random.

**Caveats:** UIDAI's numbering-scheme working paper excludes palindromic numbers, so the library rejects them even when they pass Verhoeff.

Sources: https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html, https://web.archive.org/web/20140611025606/http://uidai.gov.in/UID_PDF/Working_Papers/A_UID_Numbering_Scheme.pdf

### Aadhaar Virtual ID — `IN_VID`

Issued by: UIDAI · Holders: Aadhaar holders (revocable alias generated on request) · Check digit: Verhoeff · Confidence: moderate

**Format:** 16 digits, written `1234 5678 9012 3455`.

**Check digit:** Verhoeff over all 16 digits, as for Aadhaar.

**What the library extracts:** nothing.

**Caveats:** The library requires a leading `1`, following nationid. UIDAI does not publish the range.

Sources: https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/aadhaar-online-services/virtual-id-vid.html

### Permanent Account Number — `IN_PAN`

Issued by: Income Tax Department (Income-tax Act s.139A, Rule 114) · Holders: individuals and entities · Check digit: alphabetic check character, algorithm unpublished · Confidence: high

**Format:** 10 characters, `AAA P L 9999 A`. Example: `ABCPE1234F`.

| Part | Meaning |
|---|---|
| `AAA` | Alphabetic series |
| `P` | Holder status: P individual, C company, H HUF, F firm/LLP, A AOP, T trust, B BOI, L local authority, J artificial juridical person, G government |
| `L` | First letter of the surname (individuals) or of the name (others) |
| `9999` | Sequence 0001–9999 |
| `A` | Check character |

**Check digit:** The tenth character is an alphabetic check digit, but its algorithm is not published, so the library does not verify it.

**What the library extracts:** holder status, serial. Serial `0000` is reported as unissued.

**Caveats:** Official pages confirm the P, C, H, F, A, T, B and L codes. J and G are widely cited but were not confirmed on an official page in this review.

Sources: https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-, https://incometaxindia.gov.in/tutorials/1.permanent%20account%20number%20(pan).pdf

### Goods and Services Tax Identification Number — `IN_GSTIN`

Issued by: GST Network / tax authorities (CGST Rules 2017, rule 10) · Holders: GST-registered persons · Check digit: Luhn mod 36 · Confidence: high

**Format:** 15 characters. Example: `27AAPFU0939F1ZV`.

| Part | Meaning |
|---|---|
| `27` | State or UT code (27 = Maharashtra; 96/97/99 special) |
| `AAPFU0939F` | Holder's PAN |
| `1` | Entity number for the same PAN in that state (1–9, A–Z) |
| `Z` | Fixed |
| `V` | Check character |

**Check digit:** Luhn over base 36 (0–9 = 0–9, A–Z = 10–35). From the right, keep every first value and double every second value. Reduce each doubled value to quotient + remainder of division by 36, then sum. A valid GSTIN totals 0 mod 36; the example totals 252 = 7 × 36.

**What the library extracts:** state code and name, embedded PAN, entity number, PAN holder status.

Sources: https://cbic-gst.gov.in/, https://tutorial.gst.gov.in/userguide/registration/index.htm, https://en.wikipedia.org/wiki/Goods_and_Services_Tax_(India)

### Elector's Photo Identity Card Number — `IN_EPIC`

Issued by: Election Commission of India · Holders: registered voters · Check digit: none known · Confidence: low

**Format:** 3 letters + 7 digits. Example: `ABC1234567`.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** letter series, serial.

**Caveats:** Some older EPIC numbers use state-specific formats that this pattern does not cover. The format was not re-verified online.

Sources: https://voters.eci.gov.in/, https://www.eci.gov.in/

## Iraq (IQ)

### Iraqi National Card Number — `IQ_NID`

Issued by: Ministry of Interior (Directorate of Civil Status, Passports and Residence) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 12 digits, written `1990 1234 5678`.

**Check digit:** None published. The library checks only length and pattern, and `identify()` tries it only when `includeUnchecked` is set.

**What the library extracts:** nothing.

**Caveats:** Wikipedia describes a 12-digit decimal number that also appears as the document number in the card's ICAO machine-readable zone. It is unclear whether the number identifies the person or the card. No official structure is published.

Sources: https://en.wikipedia.org/wiki/Iraq_National_Card, https://moi.gov.iq/

## Iran (IR)

### Iranian National Code — `IR_NID`

Issued by: National Organization for Civil Registration (Sabt-e Ahval) · Holders: citizens · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 10 digits, `CCC SSSSSS K`. Example: `001-234567-9`.

| Part | Meaning |
|---|---|
| `CCC` | Code of the civil-registration office (city or county) that issued it |
| `SSSSSS` | Serial within that office |
| `K` | Check digit |

**Check digit:** Multiply the first nine digits by 10,9,…,2 and sum. Let r = sum mod 11. K = r if r < 2, otherwise 11 − r. For `001234567` the sum is 112, so r = 2 and K = 9.

**What the library extracts:** office code (as region), serial.

**Caveats:** Codes of one repeated digit (`1111111111` and so on) pass the check but are placeholders, so the library rejects them. Codes are often stored as integers and lose their leading zeros (Tehran codes start with `00`), so the library left-pads 8–9 digit input.

Sources: https://www.sabteahval.ir/, https://fa.wikipedia.org/wiki/کارت_شناسایی_ملی, https://en.wikipedia.org/wiki/National_identification_number#Iran,_Islamic_Republic_of, https://www.ekhtebar.ir/%DA%A9%D8%AF%D9%85%D9%84%DB%8C-%D9%88-%DA%A9%D8%AF%D9%BE%D8%B3%D8%AA%DB%8C/

## Iceland (IS)

### Icelandic Identification Number — `IS_KENNITALA`

Issued by: Registers Iceland (Þjóðskrá Íslands) · Holders: everyone in the national register, and foreigners given a system kennitala · Check digit: none since 18 February 2026 (legacy mod 11 reported only) · Confidence: high

**Format:** 10 digits, `DDMMYY-RRKC`. Example: `120174-3399`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth |
| `RR` | Sequence digits with no meaning (Þjóðskrá says they start at 20) |
| `K` | Legacy check digit |
| `C` | Century: 8 = 1800s, 9 = 1900s, 0 = 2000s |

**Check digit:** The legacy rule multiplies the first eight digits by 3,2,7,6,5,4,3,2, sums them, and computes 11 − (sum mod 11), where 11 → 0. A result of 10 was never issued; the sequence number was increased instead. For `12017433` the sum is 79, 79 mod 11 = 2, and 11 − 2 = 9. Þjóðskrá stopped calculating the check digit for kennitölur issued from 18 February 2026 and asked system owners to remove the check. The library therefore does not enforce it and reports it as `extra.legacyCheckDigit`.

**What the library extracts:** date of birth, age, serial, and whether the legacy check digit is valid.

Sources: https://www.skra.is/folk/eg-i-thjodskra/um-kennitolur/, https://www.skra.is/um-okkur/frettir/frett/2025/05/14/Kennitolur-an-vartolu/, https://en.wikipedia.org/wiki/Icelandic_identification_number

### Icelandic Legal Entity Identification Number — `IS_KENNITALA_ENTITY`

Issued by: Iceland Revenue and Customs / Registers Iceland · Holders: companies and other legal entities · Check digit: none since 2026 (legacy mod 11 reported only) · Confidence: moderate

**Format:** 10 digits, same layout as the personal kennitala, with 40 added to the day (41–71). Example: `590269-7199`.

| Part | Meaning |
|---|---|
| `DD+40 MM YY` | Registration (founding) date |
| `RR` | Sequence |
| `K` | Legacy check digit |
| `C` | Century |

**Check digit:** Same legacy rule as the personal kennitala; it is reported, not enforced.

**What the library extracts:** registration year, serial, and whether the legacy check digit is valid.

**Caveats:** The day + 40 rule is from Wikipedia and long practice. The skra.is page reviewed does not mention it.

Sources: https://www.skra.is/folk/eg-i-thjodskra/um-kennitolur/, https://www.skra.is/um-okkur/frettir/frett/2025/05/14/Kennitolur-an-vartolu/, https://en.wikipedia.org/wiki/Icelandic_identification_number

### Icelandic VAT Number — `IS_VSK`

Issued by: Iceland Revenue and Customs (Skatturinn) · Holders: VAT-registered businesses · Check digit: none known · Confidence: moderate

**Format:** 5–6 digits, optionally prefixed `IS`. Example: `123456`.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** nothing.

**Caveats:** Not re-verified online.

Sources: https://www.skatturinn.is/, https://en.wikipedia.org/wiki/VAT_identification_number

## Italy (IT)

### Italian Tax Code — `IT_CF`

Issued by: Agenzia delle Entrate (DM 23 December 1976) · Holders: individuals (citizens and foreigners dealing with Italian administration) · Check digit: odd/even table mod 26 letter · Confidence: high

**Format:** 16 characters, `SSS NNN YY M DD CCCC K`. Example: `RSSMRA85M01H501Q`.

| Part | Meaning |
|---|---|
| `SSS` | Consonants of the surname |
| `NNN` | Consonants of the first name |
| `YY` | Year of birth; century not encoded |
| `M` | Month letter: A B C D E H L M P R S T = Jan–Dec |
| `DD` | Day of birth; women add 40 |
| `CCCC` | Cadastral code of the comune of birth, or Z + 3 digits for a foreign country |
| `K` | Check letter |

**Check digit:** Convert each of the first 15 characters to a value. Characters in even (1-based) positions take their plain value (0–9, A = 0 … Z = 25). Characters in odd positions are looked up in the decree's odd-position table (0/A → 1, 1/B → 0, 2/C → 5, …). Sum all values; the check letter is A + (sum mod 26). For `RSSMRA85M01H501` the odd-position values sum to 78 and the even-position values to 42; 120 mod 26 = 16 → `Q`.

**Omocodia:** When two people would receive the same code, the Agenzia replaces digits with letters (0–9 → L M N P Q R S T U V). It starts at the rightmost digit and moves left through positions 15, 14, 13, 11, 10, 8, 7, then recomputes the check letter.

**What the library extracts:** date of birth (latest past century), age, gender, place-of-birth code, surname and name codes, born-abroad flag, whether omocodia letters were used.

**Caveats:** The library accepts substitutions only as a right-to-left run, because only those are issued; upstream libraries accept letters in any position.

Sources: https://www.agenziaentrate.gov.it/portale/web/guest/schede/istanze/richiesta-ts_cf/informazioni-codificazione-pf, https://www.gazzettaufficiale.it/eli/id/1977/02/09/076U0001/sg, https://it.wikipedia.org/wiki/Codice_fiscale

### Italian VAT Number — `IT_PIVA`

Issued by: Agenzia delle Entrate · Holders: businesses and self-employed people · Check digit: Luhn · Confidence: high

**Format:** 11 digits, `NNNNNNN OOO K`. Example: `12345670017`. A company's codice fiscale is the same number.

| Part | Meaning |
|---|---|
| `NNNNNNN` | Taxpayer number |
| `OOO` | Provincial office code |
| `K` | Check digit |

**Check digit:** Luhn over all 11 digits: from the right, double every second digit, subtract 9 from any result above 9, and sum. The total must be divisible by 10; the example totals 40.

**What the library extracts:** taxpayer number (as serial), office code (as region).

**Caveats:** The library rejects an all-zero taxpayer number and office code `000`. It strips an `IT` prefix.

Sources: https://www.agenziaentrate.gov.it/portale/web/guest/schede/istanze/aa7_9-dichiarazione-inizio-attivita-iva, https://ec.europa.eu/taxation_customs/vies/

## Jersey (JE)

### Jersey Social Security Number — `JE_SSN`

Issued by: Government of Jersey (Social Security) · Holders: residents, issued at birth · Check digit: none known · Confidence: moderate

**Format:** 2 letters (usually `JY`), 6 digits and a letter. Example: `JY 000000 A`.

**Check digit:** None. The library checks only length and pattern.

**What the library extracts:** serial (6 digits), suffix letter.

**Caveats:** The OECD sheet says the prefix is "usually JY". The library accepts only `JY`, because other prefixes are undocumented and accepting any two letters would match UK National Insurance numbers. The final letter is not restricted to A–D as in the UK.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Jersey-TIN.pdf, https://www.gov.je/TaxesMoney/InternationalTaxAgreements/IGAs/Pages/CommonReportingStandard.aspx, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Guernsey-TIN.pdf

### Revenue Jersey Taxpayer Identification Number — `JE_TIN`

Issued by: Revenue Jersey · Holders: resident individuals (at birth or on registration) and companies · Check digit: none known · Confidence: moderate

**Format:** 10 digits, written `100-100-1000`.

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** the whole number as serial.

**Caveats:** Entities may still use an older form (two letters + up to five digits, e.g. `CC00000`). The library does not cover it.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Jersey-TIN.pdf, https://www.gov.je/TaxesMoney/InternationalTaxAgreements/IGAs/Pages/CommonReportingStandard.aspx

## Jamaica (JM)

### Jamaican Taxpayer Registration Number — `JM_TRN`

Issued by: Tax Administration Jamaica (TAJ) · Holders: individuals, businesses and organisations · Check digit: none known · Confidence: moderate

**Format:** 9 digits, written `123-456-789`. The digits are randomly generated by TAJ's system.

| Part | Meaning |
|---|---|
| first digit | 1 = individual, 0 = organisation (TAJ: "currently") |
| remaining 8 | Random |

**Check digit:** None published. The library checks length and requires a first digit of 0 or 1.

**What the library extracts:** holder type (individual or organisation).

**Caveats:** TAJ says the first-digit split holds "currently" and is expected to remain so for the foreseeable future.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/jamaica-tin.pdf, https://www.jamaicatax.gov.jm/web/guest/trn1

## Jordan (JO)

### Jordanian National Number — `JO_NN`

Issued by: Civil Status and Passports Department · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 10 digits. Example: `9861012345`.

**Check digit:** None published. The library checks only length and pattern, and `identify()` tries it only when `includeUnchecked` is set.

**What the library extracts:** nothing.

**Caveats:** Secondary sources claim that leading digits encode birth year, gender or (for a leading 9) foreigner status, but they contradict each other and none is official. The library adopts none of these rules. personal-identity-validation's extra rules (first digit 1–2, digits 3–4 month-like) have no source and would reject real numbers.

Sources: https://www.cspd.gov.jo/, https://en.wikipedia.org/wiki/Jordanian_identity_card

## Japan (JP)

### Japanese Individual Number — `JP_MY_NUMBER`

Issued by: municipalities, under the Digital Agency and Ministry of Internal Affairs and Communications · Holders: all residents, including foreign residents · Check digit: weighted mod 11 · Confidence: high

**Format:** 12 digits: an 11-digit body and a check digit, written `1234 5678 9018`.

**Check digit:** Under MIC Ordinance No. 85 of 2014, Art. 5, multiply the 11 body digits from left to right by 6,5,4,3,2,7,6,5,4,3,2 and sum. Let r = sum mod 11. The check digit is 0 if r ≤ 1, otherwise 11 − r. For `12345678901` the sum is 212, so r = 3 and the check digit is 8.

**What the library extracts:** nothing. The number encodes no birth date, gender or region.

Sources: https://www.soumu.go.jp/kojinbango_card/, https://www.digital.go.jp/policies/mynumber, https://www.cao.go.jp/bangouseido/

### Japanese Corporate Number — `JP_CORPORATE_NUMBER`

Issued by: Commissioner of the National Tax Agency · Holders: corporations, government bodies, and some associations · Check digit: mod 9, placed first · Confidence: high

**Format:** 13 digits; the first digit is the check digit. Example: `7000012050002`, the National Tax Agency's own number.

**Check digit:** Take the 12-digit body (digits 2–13). Weight its digits 1,2,1,2,… counting from the right (2,1,2,1,… from the left) and sum. The check digit is 9 − (sum mod 9), so it is never 0. For `000012050002` the sum is 11; 11 mod 9 = 2, and 9 − 2 = 7.

**What the library extracts:** the 12-digit body as serial.

**Caveats:** The NTA overview page confirms the length and the issuer. The formula comes from the ministerial ordinance as published by the NTA; that PDF could not be text-extracted in this review.

Sources: https://www.houjin-bangou.nta.go.jp/setsumei/, https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf

## Kenya (KE)

### Kenya Revenue Authority PIN — `KE_PIN`

Issued by: Kenya Revenue Authority · Holders: individuals and organisations · Check digit: final letter, algorithm unpublished · Confidence: moderate

**Format:** 11 characters, `L DDDDDDDDD L`. Example: `A123456789Z`.

| Part | Meaning |
|---|---|
| first letter | A = individual, P = non-individual (company, partnership, trust, club) |
| 9 digits | Serial |
| last letter | Often described as a check character |

**Check digit:** KRA does not publish how the last letter is derived, so the library checks only the pattern.

**What the library extracts:** taxpayer type, serial.

**Caveats:** Secondary sources disagree on whether the final letter is a real checksum.

Sources: https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin, https://arthurdejong.org/python-stdnum/doc/2.0/stdnum.ke.pin, https://lookuptax.com/docs/tax-identification-number/kenya-tax-id-guide

### Kenyan National Identity Card Number — `KE_ID`

Issued by: National Registration Bureau · Holders: citizens aged 18+ · Check digit: none known · Confidence: low

**Format:** 1–9 digits, a plain serial. Example: `123456789`.

**Check digit:** None. The library checks length and rejects an all-zero number.

**What the library extracts:** serial, and citizenship (citizen).

**Caveats:** The length comes from identity-verification API docs (Smile ID requires `^[0-9]{1,9}$`), not from a government specification. It mostly helps when the caller already knows the number is Kenyan. Not re-verified online.

Sources: https://docs.usesmileid.com/id-coverage/verify-with-id-number/kenya, https://docs.dojah.io/api-reference/individual-verification/kenya/national-id.md

## Kyrgyzstan (KG)

### Kyrgyz Personal Identification Number — `KG_PIN`

Issued by: state registry (Ministry of Digital Development), tax service or Social Fund · Holders: citizens; foreigners and stateless persons registered in Kyrgyzstan · Check digit: one exists, but the algorithm is unpublished · Confidence: moderate

**Format:** 14 digits, `П ЧЧММГГГГ Р ННН К`. Example: `2 15011990 1 001 5`. It is also the individual's tax number (ИНН).

| Part | Meaning |
|---|---|
| `П` | Citizens: 1 female, 2 male. 3/4 foreigners and stateless persons |
| `ЧЧММГГГГ` | Date of birth, DDMMYYYY (full year) |
| `Р` | First issuer: 1 tax authority, 5 authorised state body, others the social insurance fund |
| `ННН` | Serial |
| `К` | Check digit "formed by a special algorithm" (unpublished) |

**Check digit:** The algorithm is not published, so the library does not verify it.

**What the library extracts:** date of birth, age, gender (citizens only), citizenship, issuer, serial, check digit.

**Caveats:** The layout comes from the draft order's text. The order in force (Cabinet Resolution No. 207 of 17 April 2025) has a paywalled annex. News reports differ on foreigners: one says 3 = female and 4 = male, another that foreigners move to 4 only. The library reports 3/4 as foreigner without a gender. The 14-digit ИНН of legal entities is not covered.

Sources: https://online.toktom.kg/NewsTopic/5492, https://continent-online.com/Document/?doc_id=37113206, https://kaktus.media/doc/532371_kabmin_vnes_izmeneniia_v_poriadok_prisvoeniia_pin.html

## Cambodia (KH)

### Cambodian Taxpayer Identification Number — `KH_TIN`

Issued by: General Department of Taxation (GDT) · Holders: registered taxpayers · Check digit: none known · Confidence: low

**Format:** a letter and 3 digits, a hyphen, then 9 digits (`K001-901234567`), or the older bare 9 digits.

| Part | Meaning |
|---|---|
| `K001` | Prefix code; GDT publishes no key to it |
| 9 digits | Taxpayer number |

**Check digit:** None published. The library checks only length and pattern.

**What the library extracts:** prefix (when present), the 9-digit number as serial.

**Caveats:** LookupTax cites GDT Notification 38217 and the specimen invoices in Prakas 723. No GDT document confirmed the format in this review, and sources differ (one says 9 digits only). The Khmer national ID card number is not covered because its structure is unpublished.

Sources: https://lookuptax.com/validate/cambodia/vat

## South Korea (KR)

### South Korean Resident Registration Number — `KR_RRN`

Issued by: Ministry of the Interior and Safety (local registration offices) · Holders: Korean citizens · Check digit: none for numbers issued since October 2020 (legacy check reported) · Confidence: high

**Format:** 13 digits, `YYMMDD-GXXXXXX`. Example: `800101-1234560`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth |
| `G` | 9/0 = 1800s, 1/2 = 1900s, 3/4 = 2000s; odd = male, even = female |
| `XXXXXX` | Before October 2020: 4-digit registration office (first two digits = region), a serial and a check digit. Since October 2020: random |

**Check digit:** Before October 2020 the check digit was (11 − (Σ wᵢ·dᵢ mod 11)) mod 10, with weights 2,3,4,5,6,7,8,9,2,3,4,5 over the first 12 digits. For `800101123456` the sum is 122, 122 mod 11 = 1, and (11 − 1) mod 10 = 0. Since October 2020, new and changed numbers have six random digits after G. A number does not show when it was assigned, so this document does not enforce the check.

**What the library extracts:** date of birth, age, gender, citizenship, and whether the legacy check digit is valid.

Sources: https://www.law.go.kr/lsSc.do?query=%EC%A3%BC%EB%AF%BC%EB%93%B1%EB%A1%9D%EB%B2%95%20%EC%8B%9C%ED%96%89%EB%A0%B9, https://www.mois.go.kr/, https://en.wikipedia.org/wiki/Resident_registration_number, https://www.fnnews.com/news/202006291754239525

### South Korean Foreign Registration Number — `KR_FRN`

Issued by: Ministry of Justice (Korea Immigration Service) · Holders: registered foreign residents · Check digit: none enforced · Confidence: high

**Format:** 13 digits, `YYMMDD-GXXXXXX`, with G = 5/6 (born 1900s) or 7/8 (born 2000s); odd = male. Example: `800101-5123456`.

**Check digit:** Not enforced. The pre-2020 rule for foreigners is unpublished, and later numbers use random digits. The library reports whether the citizens' legacy formula happens to match.

**What the library extracts:** date of birth, age, gender, citizenship (foreigner), legacy-check flag.

Sources: https://www.hikorea.go.kr/, https://en.wikipedia.org/wiki/Resident_registration_number

### South Korean Resident Registration Number (pre-October 2020) — `KR_RRN_LEGACY`

Issued by: Ministry of the Interior and Safety · Holders: citizens registered before October 2020 · Check digit: weighted mod 11 · Confidence: moderate · Deprecated

**Format:** 13 digits, `YYMMDD-G BBBB N C`. Example: `800101-1234560`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth |
| `G` | Century and sex, as in `KR_RRN` (citizens only) |
| `BBBB` | Registration office; the first two digits are the region |
| `N` | Serial |
| `C` | Check digit |

**Check digit:** (11 − (Σ wᵢ·dᵢ mod 11)) mod 10 with weights 2,3,4,5,6,7,8,9,2,3,4,5; the worked example under `KR_RRN` gives 0.

**What the library extracts:** date of birth, age, gender, citizenship, region, registration office, serial.

**Caveats:** Use this only when the number is known to predate October 2020. Foreigner numbers are excluded.

Sources: https://www.law.go.kr/lsSc.do?query=%EC%A3%BC%EB%AF%BC%EB%93%B1%EB%A1%9D%EB%B2%95%20%EC%8B%9C%ED%96%89%EB%A0%B9, https://www.mois.go.kr/, https://en.wikipedia.org/wiki/Resident_registration_number

### South Korean Business Registration Number — `KR_BRN`

Issued by: National Tax Service · Holders: businesses and individual entrepreneurs · Check digit: weighted mod 10 · Confidence: moderate

**Format:** 10 digits, `XXX-XX-XXXXX`. Example: `124-81-00998`.

| Part | Meaning |
|---|---|
| `XXX` | Tax office code |
| `XX` | Taxpayer type: 81/86/87/88 for-profit company head office, 85 branch, 82 non-profit, 83 state/local government, 84 foreign company, 01–79 and 90–99 individual businesses, 80/89 other |
| `XXXX` | Serial |
| last digit | Check digit |

**Check digit:** Multiply digits 1–9 by 1,3,7,1,3,7,1,3,5 and sum. Add ⌊d₉·5/10⌋, the tens digit of the last product. The check digit is (10 − sum mod 10) mod 10. For `124810099` the weighted sum is 118, plus ⌊9·5/10⌋ = 4, giving 122, so the check digit is 8.

**What the library extracts:** tax office, type code, whether it is a corporation (81–88), serial.

**Caveats:** NTS does not publish the formula. It is the long-standing public one and holds for published company numbers.

Sources: https://www.nts.go.kr/, https://www.law.go.kr/lsSc.do?query=%EB%B6%80%EA%B0%80%EA%B0%80%EC%B9%98%EC%84%B8%EB%B2%95%20%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99, https://www.oppadu.com/formulas/business-registration-number-check/

## Kuwait (KW)

### Kuwaiti Civil ID Number — `KW_CIVIL_ID`

Issued by: Public Authority for Civil Information (PACI) · Holders: citizens and residents (not distinguished) · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 12 digits, `C YYMMDD SSSS K`. Example: `280010100012`.

| Part | Meaning |
|---|---|
| `C` | Century of birth: 2 = 1900s, 3 = 2000s |
| `YYMMDD` | Date of birth |
| `SSSS` | Serial |
| `K` | Check digit |

**Check digit:** Multiply the first 11 digits by 2,1,6,3,7,9,10,5,8,4,2 and sum. K = 11 − (sum mod 11); a result of 10 or 11 is never issued. For `28001010001` the sum is 31; 31 mod 11 = 9, and 11 − 9 = 2.

**What the library extracts:** date of birth, age, serial.

**Caveats:** The weights come from django-localflavor, not from PACI; PACI does not publish the rule.

Sources: https://www.paci.gov.kw/, https://django-localflavor.readthedocs.io/en/stable/localflavor/kw/, https://en.wikipedia.org/wiki/National_identification_number#Kuwait

## Kazakhstan (KZ)

### Kazakh Individual Identification Number — `KZ_IIN`

Issued by: Ministry of Internal Affairs (national register of identification numbers) · Holders: citizens and foreigners registered in Kazakhstan · Check digit: weighted mod 11, two passes · Confidence: high

**Format:** 12 digits, `YYMMDD G NNNN C`. Example: `800101 3 0001 6`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth as recorded at registration |
| `G` | Century and sex: 1/2 = 1800s, 3/4 = 1900s, 5/6 = 2000s (odd male, even female); 0 = foreign citizen (century and sex not encoded) |
| `NNNN` | Registration serial |
| `C` | Check digit |

**Check digit:** Multiply the first 11 digits by weights 1, 2, …, 11, sum, take mod 11. If the result is 0–9 it is the check digit. If it is 10, repeat with weights 3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2. If the second pass also gives 10, the number is never issued. Example `80010130001`: 8·1 + 1·4 + 1·6 + 3·7 + 1·11 = 50; 50 mod 11 = 6 → `800101300016`.

**What the library extracts:** date of birth, age, gender (or `citizenship: "foreigner"` when G = 0), serial.

**Caveats:** The IIN is meant to be an opaque, immutable identifier: if the birth date or sex was mistyped at registration, the number keeps the wrong values, so the extracted date is the encoded one. For G = 0 the century is not encoded; the library takes the latest past year. The library rejects future birth dates and accepts G = 0 (the upstream library it was ported from did neither).

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/kazakhstan-tin.pdf, https://adilet.zan.kz/rus/docs/Z070000223_, https://ru.wikipedia.org/wiki/Индивидуальный_идентификационный_номер

### Kazakh Business Identification Number — `KZ_BIN`

Issued by: Ministry of Justice / State Corporation "Government for Citizens" (AIFC registration authorities for AIFC entities) · Holders: legal entities, branches, representative offices, joint individual entrepreneurs · Check digit: same two-pass mod 11 as the IIN · Confidence: high

**Format:** 12 digits, `YYMM T D NNNNN C`. Example: `1001 4 0 00000 3`.

| Part | Meaning |
|---|---|
| `YYMM` | Year (last two digits) and month of state registration or re-registration |
| `T` | Type: 4 resident legal entity, 5 non-resident legal entity, 6 joint individual entrepreneurship (ИП(С)) |
| `D` | Division: 0 head office, 1 branch, 2 representative office, 3 peasant/farm enterprise run as a joint undertaking |
| `NNNNN` | Registration serial (AIFC bodies and participants use 90001–99999) |
| `C` | Check digit |

**Check digit:** As for the IIN. Example `10014000000`: 1·1 + 1·4 + 4·5 = 25; 25 mod 11 = 3 → `100140000003`.

**What the library extracts:** serial, entity type, division, registration year-month (`YY-MM`), and `aifc: true` when the serial is 90001–99999 (reserved for AIFC bodies, their organisations and AIFC participants, assigned by the AIFC registration authorities).

**Caveats:** The library requires the month to be 01–12 and the type digit 4–6. Individual entrepreneurs operating alone use their IIN, not a BIN.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/kazakhstan-tin.pdf, https://adilet.zan.kz/rus/docs/Z070000223_, https://ru.wikipedia.org/wiki/Бизнес-идентификационный_номер

## Laos (LA)

### Lao Taxpayer Identification Number — `LA_TIN`

Issued by: Tax Department, Ministry of Finance · Holders: individuals, legal entities and organisations liable for tax · Check digit: none known (a control digit exists but its algorithm is unpublished) · Confidence: moderate

**Format:** 12 digits, `NNNNNNNN C V BB`; the decree writes it `aaaaaaaab-9cc`, and the library formats it that way. Example: `123456785-900`.

| Part | Meaning |
|---|---|
| `NNNNNNNN` | Sequential taxpayer number |
| `C` | Control digit "to prevent mistakes in inserting data"; algorithm not published |
| `V` | 9 = VAT-registered, 0 = not VAT-registered |
| `BB` | Branch code; 00 for an enterprise without branches |

**Check digit:** Not verified. The library checks only the length and that the VAT digit is 0 or 9.

**What the library extracts:** serial, control digit, VAT-registered flag, branch code.

**Caveats:** The layout comes from Prime Minister's Decree No. 354/PM (2007), art. 4. Since 2019 TINs come from the TaxRIS system and individuals received TINs from 2021; it is not confirmed that those still follow the 2007 layout.

Sources: https://www.laotradeportal.gov.la/upload/files/Legal_1559286512.pdf, https://documents1.worldbank.org/curated/en/907731573054558479/pdf/Improving-Starting-a-Business-in-Lao-PDR.pdf

## Lebanon (LB)

### Lebanese Identity Card Number — `LB_ID`

Issued by: Directorate General of Personal Status · Holders: Lebanese citizens holding the biometric identity card · Check digit: none known · Confidence: low

**Format:** 12 digits. Example: `123456789012`.

**Check digit:** None known. The 7-3-1 check digit printed next to the number in the card's machine-readable zone belongs to the MRZ, not to the number itself. The library checks only length and that it is all digits.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Lebanon has no national personal number; the civil "registry number" (رقم السجل) points only to a local civil register. Wikipedia says the first seven digits encode issue year, issue month and issuing department, but cites no source, so the library does not decode them. The same article calls the card number "12 alphanumeric" characters on the front and 12 numeric characters in the MRZ; the library accepts digits only.

Sources: https://en.wikipedia.org/wiki/Lebanese_identity_card, https://today.lorientlejour.com/article/1408566/

## Saint Lucia (LC)

### Saint Lucia Taxpayer Identification Number — `LC_TIN`

Issued by: Inland Revenue Department · Holders: individuals and entities, on application · Check digit: none known · Confidence: low

**Format:** 1 to 6 digits, issued sequentially. Example: `123456`.

**Check digit:** None known. The library checks only that the input is 1–6 digits with no leading zero.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** A tax account number is the TIN followed by a 2-digit tax-type code (TIN 1234 → VAT account 123427, corporate tax account 123402), so an 8-digit number is an account number, not a TIN. The "no leading zero" rule is the library's inference from sequential issuing; the IRD sheet does not state it.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/saintlucia-tin.pdf

## Liechtenstein (LI)

### Liechtenstein Personal Identification Number — `LI_PEID`

Issued by: Liechtenstein authorities (used by the Tax Administration as the TIN) · Holders: individuals and entities · Check digit: none known · Confidence: moderate

**Format:** Up to 12 digits; leading zeros are dropped, so a PEID can be as short as 7 or 4 digits. Example: `123456789012`.

**Check digit:** None known. The library checks only that the input is 1–12 digits not starting with 0.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** The PEID is printed on residence permits and cross-border-worker IDs; the OECD sheet says it was being added to national ID cards. Because leading zeros are dropped, the same number may appear with or without them; the library rejects the zero-padded form.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/liechtenstein-tin.pdf, https://www.oera.li/cr-portal/suche/suche.xhtml

## Sri Lanka (LK)

### Sri Lankan National Identity Card Number — `LK_NIC`

Issued by: Department for Registration of Persons (DRP) · Holders: Sri Lankan citizens aged 15+ · Check digit: weighted mod 11 · Confidence: moderate

**Format:** Old (until 2015): 9 digits + letter, `YY DDD SSS C L`, e.g. `911042754V`. New (from 1 January 2016): 12 digits, `YYYY DDD SSSS C`, e.g. `1990 104 0027 3`. An old number converts as `19YY DDD 0SSS C`.

| Part | Meaning |
|---|---|
| `YY` / `YYYY` | Birth year (old form: 19YY) |
| `DDD` | Day of year of birth, 001–366; women have 500 added (501–866) |
| `SSS` / `SSSS` | Serial |
| `C` | Check digit |
| `L` | Old form only: `V` (voter) or `X` (non-voter); since 2007 all cards end in `V` |

The day count always uses a 366-day year: February counts as 29 days every year, so 060 is 29 February and 061 is 1 March even in a common year (where 060 is never issued).

**Check digit:** Over the first 11 digits of the 12-digit form, weights 8, 4, 3, 2, 7, 6, 5, 7, 4, 3, 2; check = 11 − (sum mod 11), with 10 → 0 and 11 → 1. For an old number this reduces to weights 3, 2, 7, 6, 5, 4, 3, 2 over its first 8 digits. Example `91104275`: 9·3 + 1·2 + 1·7 + 0·6 + 4·5 + 2·4 + 7·3 + 5·2 = 95; 95 mod 11 = 7; 11 − 7 = 4 → `911042754V`.

**What the library extracts:** date of birth, age, gender, serial; for old numbers also the converted 12-digit number and the voter letter.

**Caveats:** DRP does not publish the check-digit algorithm; it comes from the idnumbers library and validates Wikipedia's specimen. The library rejects impossible day numbers (000, 367–500, 867–999), 29 February in a common year, and future dates, which upstream accepted; it also decodes days with the 366-day table rather than the real calendar (upstream was off by one day after February in common years).

Sources: https://www.irb-cisr.gc.ca/en/country-information/rir/Pages/index.aspx?doc=451823, https://en.wikipedia.org/wiki/National_identity_card_(Sri_Lanka)

## Liberia (LR)

### Liberian Taxpayer Identification Number — `LR_TIN`

Issued by: Liberia Revenue Authority (companies receive theirs through the Liberia Business Registry) · Holders: individuals and businesses · Check digit: none known · Confidence: moderate

**Format:** 9 digits beginning with 5. Example: `512345678`.

**Check digit:** None published. The library checks only length and the leading 5.

**What the library extracts:** serial (the 8 digits after the 5).

**Caveats:** The LRA's own taxpayer page says the TIN is "a 9-digit number beginning with 5"; company TINs in LEITI reports (e.g. 500036301) match. Whether every TIN, including older ones, starts with 5 is not stated. The national ID (NIR) number is not modelled: no published format was found.

Sources: https://revenue.lra.gov.lr/?p=9216, https://lookuptax.com/validate/liberia/tin

## Lesotho (LS)

### Lesotho National Identity Number — `LS_NIN`

Issued by: National Identity and Civil Registry (NICR), Ministry of Home Affairs · Holders: citizens with a national identity card · Check digit: none known · Confidence: low

**Format:** 12 digits, written in groups 2-8-2 (`01-12345678-17`). Example: `011234567817`.

**Check digit:** None published. The library checks only length.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** The National Identity Cards Act, 2011 says each register entry gets a unique number meeting "prescribed requirements", but the regulations defining the format are not online; the 2-8-2 layout comes from an NICR presentation slide and the meaning of each group is not stated. Four NINs quoted in court judgments have 2 as their 11th digit and pass a GTIN-style check (weights 1, 3, 1, 3, … over the first 11 digits, complement mod 10), but the slide's dummy number fails it, so it is not enforced. Not re-verified: no further published format was found online.

Sources: https://lesotholii.org/akn/ls/act/2011/9/eng@2011-03-21, https://id4africa.com/2015/presentations/31_Tumelo_Raboletsi.pdf, https://extranet.who.int/cpcd/sites/default/files/public_file_repository/LSO_Lesotho_National-Identity-Cards-Amendment-Act_2022.pdf

### Revenue Services Lesotho Taxpayer Identification Number — `LS_TIN`

Issued by: Revenue Services Lesotho (RSL) · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 9 digits, a hyphen and one digit (`123456789-0`); older TINs are 7 digits, a hyphen and one digit. Example: `1234567890`.

**Check digit:** Whether the digit after the hyphen is a check digit is not published; the library does not verify it and checks only length (8 or 10 digits).

**What the library extracts:** serial (all but the last digit), whether it is the legacy 8-digit form.

**Caveats:** Single secondary source plus room for the older form on RSL's registration form. Not re-verified.

Sources: https://lookuptax.com/validate/lesotho/tin

## Lithuania (LT)

### Lithuanian Personal Code — `LT_ASMENS_KODAS`

Issued by: Population Register (State Enterprise Centre of Registers) · Holders: citizens and registered residents · Check digit: two-pass weighted mod 11 · Confidence: high

**Format:** 11 digits, `G YYMMDD SSS C`. Example: `3 800101 000 9`.

| Part | Meaning |
|---|---|
| `G` | Century and sex: 1/2 = 1800s, 3/4 = 1900s, 5/6 = 2000s; odd male, even female |
| `YYMMDD` | Date of birth |
| `SSS` | Serial among people born that day |
| `C` | Check digit |

**Check digit:** Multiply the first 10 digits by 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, sum, mod 11. If the remainder is not 10, it is the check digit. Otherwise use weights 3, 4, 5, 6, 7, 8, 9, 1, 2, 3; if that remainder is again 10 the check digit is 0. Example `3800101000`: 3·1 + 8·2 + 1·5 + 1·7 = 31; 31 mod 11 = 9 → `38001010009`. (The OECD sheet's sample `33309240064` needs the second pass: 109 mod 11 = 10, then 169 mod 11 = 4.) Estonia uses the same rule.

**What the library extracts:** date of birth, age, gender, serial.

**Caveats:** The library accepts only G = 1–6 and rejects future birth dates (upstream accepted G = 0, 7–9 and future dates).

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/lithuania-tin.pdf, https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.2507/asr

### Lithuanian Legal Entity Code — `LT_JAK`

Issued by: Register of Legal Entities (State Enterprise Centre of Registers) · Holders: legal entities · Check digit: weighted mod 11 · Confidence: high

**Format:** 9 digits: 8-digit code + check digit. Example: `110053842`.

**Check digit:** Multiply the first 8 digits by 1, 2, …, 8, sum, take mod 11; the remainder is the check digit. A remainder of 10 is never issued: the registry draws another 8-digit code. Example `11005384`: 1 + 2 + 25 + 18 + 56 + 32 = 134; 134 mod 11 = 2 → `110053842`.

**What the library extracts:** nothing beyond validity (opaque number).

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/lithuania-tin.pdf

### Lithuanian VAT Number — `LT_VAT`

Issued by: State Tax Inspectorate (VMI) · Holders: VAT-registered legal persons; temporarily registered taxpayers and natural persons · Check digit: two-pass weighted mod 11 · Confidence: moderate

**Format:** `LT` + 9 digits (legal persons) or `LT` + 12 digits (temporarily registered / natural persons). The second-to-last digit is always 1. Example: `LT119511515`.

**Check digit:** The last digit is computed over all preceding digits with the same two-pass rule as the personal code (weights 1–9 cycling, then 3–9, 1, 2… cycling; a second 10 gives 0). Example body `11951151`: 1·1 + 1·2 + 9·3 + 5·4 + 1·5 + 1·6 + 5·7 + 1·8 = 104; 104 mod 11 = 5 → `LT119511515`.

**What the library extracts:** kind (legal person or temporary/natural person).

**Caveats:** The library checks the fixed `1` in the second-to-last position; the nationid library looked one position too early and rejected real codes such as `LT119511515`.

Sources: https://www.vmi.lt/evmi/en/pvm-moketoju-registravimas, https://ec.europa.eu/taxation_customs/vies/

## Luxembourg (LU)

### Luxembourg National Identification Number — `LU_MATRICULE`

Issued by: CTIE (Centre des technologies de l'information de l'État), national register of natural persons · Holders: residents, people registered by public administrations, Luxembourg nationals abroad · Check digit: Luhn + Verhoeff · Confidence: high

**Format:** 13 digits, `YYYY MM DD SSS C1 C2`. Example: `1893 12 01 057 32`.

| Part | Meaning |
|---|---|
| `YYYYMMDD` | Date of birth (full year) |
| `SSS` | Sequence number; since 2014 it no longer encodes sex |
| `C1` | Luhn check digit over the first 11 digits |
| `C2` | Verhoeff check digit over the first 11 digits (C1 not included) |

**Check digit:** C1: Luhn over `YYYYMMDDSSS` — double every second digit from the right, starting with the rightmost, subtract 9 from results over 9, sum, check = (10 − sum mod 10) mod 10. For `18931201057` the sum is 37, so C1 = 3. C2: Verhoeff check digit computed over the same 11 digits (the dihedral-group algorithm), so a number must pass both.

**What the library extracts:** date of birth, age, serial.

**Caveats:** Applies to the 13-digit matricule introduced by the law of 19 June 2013 (in use since 2014). The library returns a plain `YYYY-MM-DD` date and rejects future birth dates.

Sources: https://ctie.gouvernement.lu/fr/services/identification-personnes-physiques.html, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/luxembourg-tin.pdf, https://en.wikipedia.org/wiki/National_identification_number#Luxembourg

### Luxembourg VAT Number — `LU_VAT`

Issued by: Administration de l'enregistrement, des domaines et de la TVA (AED) · Holders: VAT-registered businesses · Check digit: mod 89 · Confidence: high

**Format:** `LU` + 8 digits. Example: `LU15027442`.

**Check digit:** The last two digits equal the first six digits, read as a number, mod 89 (zero-padded). Example: 150274 mod 89 = 42 → `LU 150274 42`.

**What the library extracts:** nothing beyond validity.

Sources: https://pfi.public.lu/fr.html, https://ec.europa.eu/taxation_customs/vies/

### Luxembourg Legal Entity Identification Number — `LU_MATRICULE_ENTITY`

Issued by: national register of legal persons (répertoire général, law of 30 March 1979); used by the Administration des contributions directes as the entity TIN · Holders: legal persons and other non-natural persons · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 11 digits, the last a check digit. Example: `19992401233` (synthetic).

| Part | Meaning |
|---|---|
| Digits 1–10 | Identifier; what they encode is not published |
| Digit 11 | Check digit |

**Check digit:** Multiply the first 10 digits by 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 and sum; take the remainder mod 11. A remainder of 0 gives check digit 0; a remainder of 1 is never allocated; otherwise the check digit is 11 − remainder. Example `1999240123`: 1·5 + 9·4 + 9·3 + 9·2 + 2·7 + 4·6 + 0·5 + 1·4 + 2·3 + 3·2 = 140; 140 mod 11 = 8; 11 − 8 = 3 → `19992401233`.

**What the library extracts:** nothing beyond validity. A first-10-digit body with remainder 1 is reported as `invalid_range`.

**Caveats:** Neither the OECD sheet nor the 1979 law says whether the number encodes a year or legal form. Bill 8680 (2026) says the current number can change when an entity's legal form or activity changes, which hints that it is not a pure serial, but gives no layout; the bill would replace it with a new 11-digit enterprise identifier (INE) with no meaning. No real identifiers were found to cross-check the rule, hence `moderate`.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/luxembourg-tin.pdf, https://legilux.public.lu/eli/etat/leg/loi/1979/03/30/n1/jo, https://impotsdirects.public.lu/fr/az/n/num__ro_dossier.html, https://wdocs-pub.chd.lu/docs/Dossiers_parlementaires/8680/20260107_Depot.pdf

## Latvia (LV)

### Latvian Personal Code — `LV_PERSONAS_KODS`

Issued by: Office of Citizenship and Migration Affairs (PMLP), Register of Natural Persons · Holders: people assigned a code until 30 June 2017 who have not changed it · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 11 digits, `DDMMYY C NNN K`, often written `DDMMYY-CNNNK`. Example: `010180-10000`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth |
| `C` | Century: 0 = 1800s, 1 = 1900s, 2 = 2000s |
| `NNN` | Serial |
| `K` | Check digit |

**Check digit:** Multiply the first 10 digits by 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 and sum; K = (1101 − sum) mod 11, with 10 written as 0. Example `0101801000`: 6 + 7 + 72 + 5 = 90; (1101 − 90) mod 11 = 10 → K = 0 → `01018010000`.

**What the library extracts:** date of birth, age, serial.

**Caveats:** The code does not encode sex. Since 1 July 2017 holders may change a dated code once to a new random code (see below). The library also checks month, day and century and rejects future dates, which upstream did not.

Sources: https://likumi.lv/ta/id/296185, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf, https://www.pmlp.gov.lv/en/change-personal-identity-number

### Latvian Personal Code (since 2017, no date) — `LV_PERSONAS_KODS_NEW`

Issued by: PMLP, Register of Natural Persons · Holders: people registered since 1 July 2017, and holders of old codes who asked for a change · Check digit: none · Confidence: high

**Format:** 11 digits: `3`, then a random digit 2–9, then nine random digits; may be written `32XXXX-XXXXX`. Example: `321234-56789`.

**Check digit:** None — the regulation defines no check digit and no encoded data. The library checks only the `3[2-9]` prefix and length.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** The idnumbers library ran the old check digit over these codes and rejected about 90% of them; the library keeps them as a separate, shape-only document so they are not reported as checksum-verified.

Sources: https://likumi.lv/ta/id/296185, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf, https://www.pmlp.gov.lv/en/change-personal-identity-number

### Latvian VAT Number — `LV_VAT`

Issued by: State Revenue Service (VID) · Holders: VAT-registered legal and natural persons · Check digit: weighted mod 11 (legal persons) · Confidence: moderate

**Format:** `LV` + 11 digits. Legal persons' numbers start with 4–9 (Register of Enterprises numbers start with 4 or 5; numbers issued by the State Revenue Service start with 9). Natural persons use their personal code. Example: `LV40003521600`.

**Check digit:** Legal persons: multiply the 11 digits by 9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1; the sum mod 11 must be 3. Example `40003521600`: 36 + 9 + 50 + 4 + 5 + 42 = 146; 146 mod 11 = 3 ✓. Natural persons: validated as a personal code (old form: real past date and check digit; new form: `3[2-9]` prefix).

**What the library extracts:** kind (legal or natural person).

**Caveats:** nationid accepted any natural-person number whose first four digits look like a day and month; the library validates the personal code fully. It is not confirmed that the mod-11 = 3 rule holds for the 9-prefixed numbers issued by the State Revenue Service.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf, https://ec.europa.eu/taxation_customs/vies/

## Libya (LY)

### Libyan National Number — `LY_NN`

Issued by: Civil Registry Authority, under Law No. 8 of 2014 · Holders: Libyan citizens (granted at birth from Civil Registry data) · Check digit: unpublished · Confidence: high

**Format:** 12 digits, `S YYYY NNNNNN K`. Example: `1 1990 001234 5`.

| Part | Meaning |
|---|---|
| `S` | Sex: 1 male, 2 female |
| `YYYY` | Year of birth |
| `NNNNNN` | Sequence number within the birth year, counted separately for each sex |
| `K` | Check digit "used to check the national number" |

**Check digit:** The law does not give the algorithm and none is published, so the library does not verify it.

**What the library extracts:** birth year, gender, serial, the raw check digit.

**Caveats:** Birth years before 1900 or after the reference year are rejected as `invalid_date` (the register was built from living citizens in the 2010s). The high confidence applies to the structure, which is set out in the law; the number itself is checked only for shape.

Sources: https://security-legislation.ly/latest-laws/law-no-8-of-2014-on-the-national-id-number/

## Morocco (MA)

### Moroccan National Identity Card Number — `MA_CIN`

Issued by: Direction Générale de la Sûreté Nationale (DGSN) · Holders: Moroccan citizens · Check digit: none known · Confidence: low

**Format:** 1 or 2 letters (issuing office / region) followed by up to 6 digits. Example: `AB123456`.

| Part | Meaning |
|---|---|
| Letters | Issuing office (region); no public table of prefixes |
| Digits | Serial |

**Check digit:** None in the written number. The library checks only the shape.

**What the library extracts:** region (raw letter prefix), serial.

**Caveats:** Law 04-20 on the electronic national identity card (CNIE) gives every person a unique national number but does not define its structure. The World Bank ID4D diagnostic (2014) mentions "2 digit check sum" after the serial; those digits are not part of the number people write and no algorithm is published. English Wikipedia's "Luhn, 12 characters" claim cites that report, which says neither.

Sources: https://adala.justice.gov.ma/api/uploads/2025/10/13/Dahir n° 1-20-80 portant promulgation de la loi n° 04-20 relative à la Carte Nationale d'Identité Electronique-1760343912466.pdf, https://documents1.worldbank.org/curated/en/363901472492458796/pdf/107931-WP-P156810-OUO-9.pdf

### Moroccan Common Company Identifier — `MA_ICE`

Issued by: Moroccan administration via the ICE portal (compulsory since mid-2016) · Holders: companies and their establishments · Check digit: mod 97 · Confidence: moderate

**Format:** 15 digits, `EEEEEEEEE SSSS CC`. Example: `001561191 0000 66`.

| Part | Meaning |
|---|---|
| `EEEEEEEEE` | Enterprise number |
| `SSSS` | Establishment number |
| `CC` | Control digits |

**Check digit:** The whole 15-digit number read as an integer must be divisible by 97, i.e. CC = 97 − (first 13 digits × 100 mod 97) (giving 97 when that remainder is 0). Example: 001561191000000 mod 97 = 31; 97 − 31 = 66 → `001561191000066`.

**What the library extracts:** enterprise serial, establishment number.

**Caveats:** The ICE portal does not publish the rule; it is documented by python-stdnum and holds on its examples and on Ciments du Maroc's ICE in published statutes. The Identifiant Fiscal (IF) is not covered: no rule found.

Sources: https://www.ice.gov.ma/, https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.ma.ice

## Moldova (MD)

### Moldovan Personal Identification Number — `MD_IDNP`

Issued by: Public Services Agency (State Population Register) · Holders: citizens, and foreigners/stateless persons entered in the register · Check digit: unpublished ("special algorithm") · Confidence: low

**Format:** 13 digits, `2 ГГГ XXX YYYYY K`. Example: `2 002 001 23456 7`.

| Part | Meaning |
|---|---|
| `2` | Index for natural persons among state identifiers (legal entities' IDNO starts with 1) |
| `ГГГ` | Last three digits of the year the IDNP was assigned |
| `XXX` | Registrar office code |
| `YYYYY` | Order number within that year and office |
| `K` | Check digit |

Nothing about the holder (birth date, sex) is encoded.

**Check digit:** Described only as a "special algorithm"; not published, so not verified.

**What the library extracts:** for numbers starting with 2: assignment year, office code, serial. Numbers starting with 0 are accepted without decoding.

**Caveats:** IDNPs assigned in the 1990s, still in circulation, start with 0; the current regulation (HG 333/2023) doesn't cover them, so that prefix is accepted but not decoded. If the encoded year is in the future, the library returns no decoded fields. idnumbers accepted any 13 digits; the library requires a first digit of 0 or 2.

Sources: https://oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Moldova-TIN.pdf, https://e-services.md/ro/verifica-idnp

### Moldovan State Identification Number of Legal Units — `MD_IDNO`

Issued by: Public Services Agency (State Register of Legal Units) on state registration; the State Tax Service for some entities created by normative act · Holders: legal entities and other registered legal units; it is their TIN · Check digit: weighted mod 10 (7, 3, 1), derived · Confidence: moderate

**Format:** 13 digits, `1 XXX YYY ZZZZZ K`. Example: `1 026 600 12345 2` (synthetic).

| Part | Meaning |
|---|---|
| `1` | Index of legal units among state identifiers (IDNPs start with 2 or 0) |
| `XXX` | Last three digits of the year the IDNO was assigned |
| `YYY` | Code of the registering office (600–611 in published lists) |
| `ZZZZZ` | Order number of the registration in that year and office |
| `K` | Check digit |

**Check digit:** Not published by the issuer. Multiplying the first 12 digits by 7, 3, 1, 7, 3, 1, … and taking the sum mod 10 gives the check digit for all 1,861 IDNOs in two official lists (SFS large taxpayers 2021–22 and ASP's February 2026 registration bulletin), so the library enforces it. Example `102660012345`: 1·7 + 0·3 + 2·1 + 6·7 + 6·3 + 0·1 + 0·7 + 1·3 + 2·1 + 3·7 + 4·3 + 5·1 = 112; 112 mod 10 = 2 → `1026600123452`.

**What the library extracts:** assignment year, office code, serial.

**Caveats:** The layout is Annex 2 of Government Decision 272/2002 as quoted in Moldova's OECD TIN sheet. The library reads `XXX` 990–999 as 1990–1999 and everything else as 20XX, and rejects a year after the reference date as `invalid_range`. Published IDNOs seen so far all have years 2002 onward. Whether the IDNP's unpublished "special algorithm" is the same rule is not known.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/moldova-tin.pdf, https://dataset.gov.md/resources/2022-01/Contribuabili%20mari%202021-2022.pdf, https://www.asp.gov.md/sites/default/files/date-deschise/date-statistice/2026/rsud/buletinul-electronic/Buletinul-Electronic-02-2026.pdf

## Montenegro (ME)

### Montenegrin Unique Master Citizen Number — `ME_JMBG`

Issued by: Ministry of Interior (civil register) · Holders: citizens and registered foreigners · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `DD MM YYY RR BBB K`. Example: `0101990 26 000 2`.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth; YYY is the last three digits of the year (9xx → 19xx, 0xx → 20xx, 8xx → 18xx) |
| `RR` | Region of first registration; Montenegro uses 21–29, foreigners in Montenegro 02 |
| `BBB` | Serial: 000–499 male, 500–999 female |
| `K` | Check digit |

**Check digit:** Multiply the first 12 digits by 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 and sum; m = 11 − (sum mod 11). If m is 1–9, K = m; if m is 10 or 11, K = 0. Example `010199026000`: 6 + 4 + 27 + 18 + 12 + 30 = 97; 97 mod 11 = 9; 11 − 9 = 2 → `0101990260002`.

**What the library extracts:** date of birth, age, gender, region code and name, register area, serial; `citizenship: "foreigner"` for codes 01–08.

**Caveats:** People who moved between Yugoslav republics before 1991 kept their number, so Montenegrin holders can carry any region code; the library accepts all allocated codes (unused 20, 40, 90, 97–99 are rejected) and does not infer citizenship from the region. Future birth dates are rejected. Shared engine with Serbia, Bosnia, Croatia, North Macedonia and Slovenia.

Sources: https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number, https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345

## Madagascar (MG)

### Malagasy National Identity Card Number — `MG_CIN`

Issued by: Malagasy civil authorities (district and commune offices) · Holders: Malagasy citizens · Check digit: none known · Confidence: low

**Format:** 12 digits, `XXX YY Z NNNNNN`. Example: `101 01 1 123456`.

| Part | Meaning |
|---|---|
| `XXX` | District code |
| `YY` | Commune code within the district |
| `Z` | Sex (which value means which sex is not documented) |
| `NNNNNN` | Chronological serial |

**Check digit:** None known. The library checks only length.

**What the library extracts:** region (raw district code), commune code, raw sex digit, serial. No gender is set.

**Caveats:** Single source (World Bank ID4D diagnostic, 2017). It also notes numbers are assembled by hand and duplicates and clerical errors exist, so the library does not range-check the parts. The number stays the same when a card is renewed. Not re-verified online.

Sources: https://documents1.worldbank.org/curated/en/809191510763351833/ID4D-Country-Diagnostic-Madagascar.pdf

### Malagasy Tax Identification Number — `MG_NIF`

Issued by: Direction Générale des Impôts (DGI), online registration system · Holders: individuals and companies · Check digit: unpublished · Confidence: moderate

**Format:** 10 digits. Example: `4001257310`.

**Check digit:** The World Bank report says a control key sits at each end around an 8-digit random sequence, but the algorithm is not known; the library checks only length.

**What the library extracts:** serial (the middle 8 digits).

**Caveats:** Length confirmed by org-id.guide's example and tax guides; no official structure specification found.

Sources: https://documents1.worldbank.org/curated/en/809191510763351833/ID4D-Country-Diagnostic-Madagascar.pdf, https://org-id.guide/list/MG-NIF

## Marshall Islands (MH)

### Marshall Islands Social Security Number — `MH_SSN`

Issued by: Marshall Islands Social Security Administration (MISSA) · Holders: employees (on application) · Check digit: none known · Confidence: high

**Format:** 8 digits, `04-NNNNNN`. Example: `04-086123`.

| Part | Meaning |
|---|---|
| `04` | Code the United States assigned to the Marshall Islands among the freely associated states |
| `NNNNNN` | Serial |

**Check digit:** None described. The library checks only the `04` prefix and length.

**What the library extracts:** serial.

**Caveats:** The RMI issues no TINs; this number (also called the employee identification number) identifies individual taxpayers and appears on passports and driver's licences.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/marshall-islands-tin.pdf, http://www.rmimissa.org/

### Marshall Islands Employer Identification Number — `MH_EIN`

Issued by: MISSA · Holders: employers (on application) · Check digit: none known · Confidence: high

**Format:** 7 digits, `NNNNN-04`. Example: `08612-04`.

| Part | Meaning |
|---|---|
| `NNNNN` | Serial |
| `04` | Marshall Islands code |

**Check digit:** None described. The library checks only the `04` suffix and length.

**What the library extracts:** serial.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/marshall-islands-tin.pdf, http://www.rmimissa.org/

## North Macedonia (MK)

### North Macedonian Unique Master Citizen Number — `MK_EMBG`

Issued by: Ministry of Interior · Holders: citizens and registered foreigners · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `DD MM YYY RR BBB K`. Example: `0101990 45 000 6`.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth; YYY is the last three digits of the year |
| `RR` | Region of first registration; North Macedonia uses 41–49 (e.g. 45 Skopje), foreigners in Macedonia 04 |
| `BBB` | Serial: 000–499 male, 500–999 female |
| `K` | Check digit |

**Check digit:** Same as the Montenegrin JMBG: weights 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2; m = 11 − (sum mod 11); K = m for 1–9, else 0. Example `010199045000`: 6 + 4 + 27 + 18 + 24 + 25 = 104; 104 mod 11 = 5; 11 − 5 = 6 → `0101990450006`.

**What the library extracts:** date of birth, age, gender, region code and name, register area, serial; `citizenship: "foreigner"` for codes 01–08.

**Caveats:** Same notes as Montenegro: any allocated region code is accepted because pre-1991 movers kept their numbers; future birth dates are rejected. Known locally as ЕМБГ / EMBG.

Sources: https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number, https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345

## Mali (ML)

### Malian National Identification Number — `ML_NINA`

Issued by: national statistics service (Direction Nationale de la Statistique et de l'Informatique) · Holders: natural and legal persons · Check digit: key letter, algorithm unpublished · Confidence: moderate

**Format:** 14 digits + 1 letter, `N S YY LLLLLLL QQQ K`. Example: `1 1 90 1234567 001 K`.

| Part | Meaning |
|---|---|
| `N` | Natural person: nationality; legal person: legal form |
| `S` | Natural person: sex; legal person: legal status |
| `YY` | Year of birth (persons) or creation (entities), two digits |
| `LLLLLLL` | Locality of birth or creation |
| `QQQ` | Sequence distinguishing same-sex persons born the same year in the same locality (or entities of the same form/status) |
| `K` | Control key, a letter of the French alphabet |

**Check digit:** The decree requires a control letter but does not say how it is computed; not verified.

**What the library extracts:** region (locality code), serial, and raw first code, second code, year digits and key letter.

**Caveats:** Décret 06-442/P-RM (2006), art. 1, defines the layout but not the code values for the first two digits, the locality table or the key algorithm, and the number alone does not show whether it belongs to a person or an entity, so nothing is decoded into gender or a full year. The NIF is not covered.

Sources: https://faolex.fao.org/docs/pdf/Mli176233.pdf

## Myanmar (MM)

### Myanmar National Registration Card Number — `MM_NRC`

Issued by: Myanmar immigration and national registration authorities · Holders: citizens, associate citizens, naturalised citizens · Check digit: none · Confidence: moderate

**Format:** `S/TOWNSHIP(T)NNNNNN`, in Latin transliteration or Burmese script. Example: `12/MaBaNa(N)123456` (`၁၂/မဘန(နိုင်)၁၂၃၄၅၆`).

| Part | Meaning |
|---|---|
| `S` | State/region number, 1–14 |
| `TOWNSHIP` | Township abbreviation (about three syllables) |
| `T` | Citizenship class under the 1982 Citizenship Law: N (နိုင်, naing, citizen), E (ဧည့်, ae, associate citizen), P (ပြု, pyu, naturalised citizen) |
| `NNNNNN` | 6-digit serial |

**Check digit:** None. The library checks the shape only.

**What the library extracts:** citizenship class, state/region number, township (raw), serial.

**Caveats:** No official specification or township table is published; the format is from consistent secondary sources. python-myanmar allows states 1–13 only, while mm-nric and Wikipedia allow 14 (Ayeyarwady); the library accepts 14. Township names are not checked against a list. Normalisation drops spaces, maps Burmese digits and class words to ASCII and uppercases. The IRD TIN and the planned unique ID are not covered.

Sources: https://python-myanmar.readthedocs.io/en/stable/_modules/myanmar/nrc.html, https://github.com/Aaronkst/mm-nric, https://qhrm.io/answers/national-registration-card-nrc-role-hiring

## Mongolia (MN)

### Mongolian Civil Register Number — `MN_RD`

Issued by: General Authority for State Registration · Holders: Mongolian citizens (also used as the individual taxpayer number) · Check digit: unpublished · Confidence: moderate

**Format:** 2 Cyrillic letters + 8 digits, `ББ YY MM DD S C`. Example: `АБ 90 01 01 1 2`.

| Part | Meaning |
|---|---|
| `ББ` | Code of an aimag/district and sum/khoroo (tac.mn: of permanent residence; Ч or У for people born in Ulaanbaatar) |
| `YY` | Birth year (two digits) |
| `MM` | Birth month; 20 is added for people born in 2000 or later (21–32) |
| `DD` | Birth day |
| `S` | Sex: odd male, even female |
| `C` | Check digit "to verify correct entry" |

**Check digit:** The algorithm is not published, so the library does not verify it.

**What the library extracts:** date of birth, age, gender, region (letter code), raw check digit.

**Caveats:** The layout is from tac.mn, citing the annex to Order No. 331 (2010); the law itself says only 2 letters + 8 digits encoding birth date and sex. tac.mn describes the letters as the aimag/district and sum/khoroo of permanent residence but also ties Ч/У to birth in Ulaanbaatar, so it is unsettled whether they reflect residence or birthplace; the library returns the raw code without calling it either. Latin look-alike letters are not mapped to Cyrillic. The 12-digit civil registration number (2022 amendment) and foreigners' F-register numbers are not covered.

Sources: https://legalinfo.mn/en/edtl/15588, https://www.tac.mn/article/33466

### Mongolian Legal Entity Register Number — `MN_ENTITY`

Issued by: General Authority for State Registration · Holders: legal entities · Check digit: none known · Confidence: low

**Format:** 7 digits. Example: `2071096` (Mongolian Stock Exchange).

**Check digit:** None published. The library checks only length.

**What the library extracts:** nothing beyond validity of shape.

**Caveats:** Used on tax filings; commercial guides disagree on whether the tax authority's taxpayer number is always the same as this register number. Secondary sources only; not re-verified.

Sources: https://lookuptax.com/docs/tax-identification-number/mongolia-tax-id-guide, https://taxdo.com/resources/global-tax-id-validation-guide/mongolia

## Macao (MO)

### Macao Resident Identity Card Number — `MO_BIR`

Issued by: Identification Services Bureau (DSI) · Holders: permanent and non-permanent residents of Macao · Check digit: unpublished (not verified) · Confidence: low

**Format:** 8 digits, written `NNNNNNN(C)`. Example: `5215432(8)`.

| Part | Meaning |
|---|---|
| `N` (1st digit) | Issuing series; the library accepts 0, 1, 5, 7, 8 |
| `NNNNNN` | Serial |
| `(C)` | Control digit, shown in brackets |

**Check digit:** Administrative Regulation 23/2002 says the number is seven digits plus a control digit, but the algorithm has never been published. The library checks only the length and the allowed first digit.

**What the library extracts:** the series digit (`extra.series`), the serial and the control digit as text.

**Caveats:** Labels for the first digit that circulate online (e.g. "public security police", "entity") come from a tax-number aggregator, not the DSI, so the library returns only the raw digit. A government notice on the 2004 card replacement does treat the first digit as meaningful (cards were replaced in the order 7, 5, 1). Sources disagree on how the ID number relates to the Macao TIN.

Sources: https://images.io.gov.mo/bo/i/2002/44/rega-23-2002.pdf, https://en.wikipedia.org/wiki/Macau_Resident_Identity_Card, https://www.gov.mo/en/services/ps-1071/faqs/

## Malta (MT)

### Maltese Identity Card Number — `MT_ID`

Issued by: Identity Malta, Identity Cards Unit · Holders: Maltese citizens, foreign residents with a residence permit · Check digit: none · Confidence: high

**Format:** 7 digits + 1 letter. Example: `0012345M` (often written without leading zeros, `12345M`; the library pads to 7 digits).

| Part | Meaning |
|---|---|
| digits 1–5 | Birth registration number at the Public Registry |
| digits 6–7 | Last two digits of the year the birth was registered |
| letter | B/M/L = Malta, registered 1800s/1900s/2000s; Z/G/H = Gozo, 1800s/1900s/2000s; A = foreign national with residence permit; P = Maltese citizen born abroad without a registrable birth certificate |

For A and P numbers the digits are an allocated number, not a birth registration.

**Check digit:** None. The library checks the shape and that the registration year is not in the future.

**What the library extracts:** island (`region`) and registration year for B/M/L/Z/G/H; citizenship for A (foreigner) and P (citizen); the 5-digit serial. The same number is used as the individual's TIN.

Sources: https://identita.gov.mt/identity-cards-unit/useful-info/, https://en.wikipedia.org/wiki/Maltese_identity_card

### Maltese VAT Number — `MT_VAT`

Issued by: Malta Tax and Customs Administration · Holders: VAT-registered persons and companies · Check digit: weighted mod 37 · Confidence: high

**Format:** `MT` + 8 digits. Example: `MT11679112`.

**Check digit:** Multiply the 8 digits by 3, 4, 6, 7, 8, 9, 10, 1 and add. The number is valid when the sum is divisible by 37. Example `11679112`: 1·3 + 1·4 + 6·6 + 7·7 + 9·8 + 1·9 + 1·10 + 2·1 = 185 = 5 × 37, so it is valid.

**What the library extracts:** nothing beyond validity.

Sources: https://mtca.gov.mt/, https://ec.europa.eu/taxation_customs/vies/

## Mauritius (MU)

### Mauritian National Identity Card Number — `MU_NIC`

Issued by: Civil Status Division / Mauritius National Identity Scheme · Holders: citizens, assigned at birth registration · Check digit: exists but unpublished · Confidence: moderate

**Format:** 14 characters, `L DDMMYY NNNNNN K`. Example: `A0101800000017`.

| Part | Meaning |
|---|---|
| `L` | First letter of the holder's surname at birth |
| `DDMMYY` | Date of birth; century not encoded |
| `NNNNNN` | Sequence number |
| `K` | Check character (digit or letter) |

**Check digit:** A check character exists, but the government has not published the algorithm. python-stdnum implements one from a specification shared privately by a Mauritian government adviser. The library does not use it because there is no citable source, so it checks only the shape and the birth date.

**What the library extracts:** date of birth (latest century that gives a past date), age, the 6-digit sequence, and the surname initial (`extra.surnameInitial`).

**Caveats:** The surname-initial meaning of the letter comes from python-stdnum's documentation and its mailing list, not from an official page. Since 2024 Mauritius has been issuing a new eID card (MNIC 3.0); nothing found says the number format changed.

Sources: https://mnis.govmu.org/English/ID%20Card/Pages/default.aspx, https://arthurdejong.org/python-stdnum/doc/stdnum.mu.nid, https://lists.arthurdejong.org/python-stdnum-users/2018/msg00003.html, https://lists.arthurdejong.org/python-stdnum-users/2018/msg00007.html, https://docs.dataprep.ai/user_guide/clean/clean_mu_nid.html

## Maldives (MV)

### Maldives Taxpayer Identification Number — `MV_TIN`

Issued by: Maldives Inland Revenue Authority (MIRA) · Holders: individuals and entities · Check digit: none known · Confidence: high

**Format:** a 7-digit business partner (BP) number, optionally followed by a 3-letter revenue code and a 3-digit running number. Example: `1000001GST501`.

| Part | Meaning |
|---|---|
| `1000001` | Business partner number, unique to the taxpayer |
| `GST` | Revenue (tax-type) code: e.g. GST, GRT (green tax), BIT, IIT, PIT, CIT, EWT, NWT |
| `501` | Running number for that registration |

Each tax registration gets its own TIN of the form `{BP}{revenue code}{running number}`: a taxpayer with BP 1000001 who registers for GST gets `1000001GST501`, and for green tax `1000001GRT001`. MIRA's forms ask for "the first seven digits of your TIN", i.e. the BP number.

**Check digit:** None described. The library checks the length (7 or 13) and pattern, and accepts any three letters as the revenue code.

**What the library extracts:** BP number (`serial`, `extra.businessPartnerNumber`), and for 13-character TINs the tax type and registration number.

**Caveats:** The national ID card number is not covered; its format could not be confirmed from an official source.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Maldives-TIN.pdf, https://www.mira.gov.mv/Pages/View/gstlookup

## Mexico (MX)

### Clave Única de Registro de Población — `MX_CURP`

Issued by: RENAPO (Registro Nacional de Población) · Holders: citizens and residents · Check digit: weighted mod 10 · Confidence: high

**Format:** 18 characters, `AAAA YYMMDD S EE CCC H V`. Example: `GOMC850315HDFRRR07`.

| Part | Meaning |
|---|---|
| `AAAA` | First letter + first internal vowel of the first surname, first letter of the second surname, first letter of the given name (X substitutes where needed, including for "inconvenient" words) |
| `YYMMDD` | Date of birth |
| `S` | Sex: H (hombre), M (mujer), X (non-binary, since 2022) |
| `EE` | State of birth (32 two-letter codes, NE = born abroad) |
| `CCC` | First internal consonants of first surname, second surname, given name |
| `H` | Homoclave: a digit for births up to 1999, a letter from 2000 |
| `V` | Check digit |

**Check digit:** Map each of the first 17 characters to a value with the alphabet `0–9 A–N Ñ O–Z` (0..36, so Ñ = 24). Multiply by weights 18 down to 2, add, and take (10 − sum mod 10) mod 10. Example: the products for `GOMC850315HDFRRR0` sum to 2163; (10 − 3) mod 10 = 7, matching the last digit.

**What the library extracts:** date of birth (century from position 17), age, gender (H/M), state code and name, homoclave (`serial`), raw sex letter.

**Caveats:** RENAPO's published instructivo explains the structure; the check-digit weights are confirmed by secondary sources rather than a primary RENAPO formula. The library improves on nationid by rejecting impossible dates and accepting sex X.

Sources: https://www.gob.mx/curp/, https://www.dof.gob.mx/nota_detalle.php?codigo=5366011&fecha=18/10/2014, https://dof.gob.mx/nota_detalle_popup.php?codigo=5526717, https://en.wikipedia.org/wiki/Unique_Population_Registry_Code

### RFC persona física — `MX_RFC_PF`

Issued by: SAT (Servicio de Administración Tributaria) · Holders: individual taxpayers · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 13 characters, `AAAA YYMMDD HH V`. Example: `PEMJ800101AB6`.

| Part | Meaning |
|---|---|
| `AAAA` | Letters from surnames and given name (same idea as the CURP; offensive words get an X) |
| `YYMMDD` | Date of birth |
| `HH` | Homoclave, assigned by SAT to separate homonyms |
| `V` | Check character (0–9 or A) |

**Check digit:** Map the first 12 characters with SAT's table: 0–9 → 0–9, A–N → 10–23, & → 24, O–Z → 25–36, space → 37, Ñ → 38. Multiply by weights 13 down to 2 and add. Check = 11 − (sum mod 11), with 11 → 0 and 10 → A. Example `PEMJ800101AB`: sum 1072, 1072 mod 11 = 5, 11 − 5 = 6.

**What the library extracts:** date of birth, age, homoclave. The generic RFCs `XAXX010101000` (domestic public) and `XEXX010101000` (foreign) are accepted and flagged `extra.generic`.

**Caveats:** SAT does not publish the check algorithm on a citable page; it is consistent across independent implementations. The library also rejects the "palabras inconvenientes" list as first four letters and impossible or future dates.

Sources: https://www.sat.gob.mx/consultas/44083/consulta-tu-informacion-fiscal, https://www.sat.gob.mx/normatividad/58917/resolucion-miscelanea-fiscal-, https://es.wikipedia.org/wiki/Registro_Federal_de_Contribuyentes

### RFC persona moral — `MX_RFC_PM`

Issued by: SAT · Holders: companies and other legal entities · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 12 characters, `AAA YYMMDD HH V`. Example: `ABC010203XYA`.

| Part | Meaning |
|---|---|
| `AAA` | Letters from the company name |
| `YYMMDD` | Date of incorporation |
| `HH` | Homoclave |
| `V` | Check character |

**Check digit:** Same as the individual RFC, computed over the 11-character body left-padded with one space so there are 12 positions (the pad space has value 37 and gets weight 13).

**What the library extracts:** incorporation date (`extra.incorporationDate`) and homoclave.

Sources: https://www.sat.gob.mx/normatividad/58917/resolucion-miscelanea-fiscal-, https://es.wikipedia.org/wiki/Registro_Federal_de_Contribuyentes

### Número de Seguridad Social — `MX_NSS`

Issued by: IMSS (Instituto Mexicano del Seguro Social) · Holders: workers and others affiliated with IMSS · Check digit: Luhn · Confidence: high

**Format:** 11 digits, `SS AA NN FFFF C`. Example: `12345678903`.

| Part | Meaning |
|---|---|
| `SS` | IMSS subdelegación where the number was first assigned |
| `AA` | Year of affiliation (2 digits) |
| `NN` | Year of birth (2 digits) |
| `FFFF` | Sequential folio within the subdelegación |
| `C` | Check digit |

**Check digit:** Luhn. From the right, double every second digit (subtract 9 if over 9) and add all digits; the total must end in 0. Example `12345678903` totals 50.

**What the library extracts:** subdelegación (`region`), folio (`serial`), affiliation and birth years as two-digit strings. All-same-digit numbers are rejected.

**Caveats:** IMSS does not publish the meaning of the digits on an official page; the layout comes from consistent press and HR sources.

Sources: https://www.imss.gob.mx/tramites/imss02008, https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/asignacionNSS

### Clave de Elector — `MX_CLAVE_ELECTOR`

Issued by: INE (Instituto Nacional Electoral) · Holders: registered voters · Check digit: none known · Confidence: low

**Format:** 18 characters, `CCCCCC YYMMDD EE S HHH`. Example: `GMRPRZ85091009H123`.

| Part | Meaning |
|---|---|
| `CCCCCC` | Six letters taken from the surnames and given name |
| `YYMMDD` | Date of birth |
| `EE` | State of birth, INEGI number 01–32 |
| `S` | Sex: H, M or X |
| `HHH` | 3-digit homoclave, assigned by INE |

**Check digit:** None published. The library checks the pattern, the date and the state range.

**What the library extracts:** date of birth, age, gender, state code and name, homoclave (`serial`).

**Caveats:** nationid reads the middle digits as YY EE MM DD; INE's training material gives date then entidad, which the library follows.

Sources: https://ayudarepresentantes.ine.mx/pel-2025/materiales/MaterialCap_CredElector.pdf, https://www.ine.mx/credencial/

### Mexican Passport Number — `MX_PASAPORTE`

Issued by: Secretaría de Relaciones Exteriores (SRE) · Holders: Mexican citizens · Check digit: none known · Confidence: moderate

**Format:** one letter + 8 digits. Example: `G12345678`.

**Check digit:** None on the printed number (the MRZ has its own ICAO check digits). The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.gob.mx/sre, https://en.wikipedia.org/wiki/Mexican_passport

## Malaysia (MY)

### Malaysian Identity Card Number — `MY_NRIC`

Issued by: Jabatan Pendaftaran Negara (JPN, National Registration Department) · Holders: citizens (MyKad, MyKid) and permanent residents (MyPR) · Check digit: none · Confidence: high

**Format:** 12 digits, `YYMMDD-PB-###G`. Example: `800101-14-5013`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth; century not encoded |
| `PB` | Place-of-birth code: 01–16 and 21–59 are states (several codes per state), 82 = state unknown, 60–68, 71–72, 74–79, 83–93, 98, 99 = countries/regions abroad |
| `###` | Serial; first digit usually 5–7 for births before 2000 and 0 (sometimes 1–4) from 2000 |
| `G` | Odd for male, even for female |

**Check digit:** None. The library rejects unassigned place-of-birth codes (00, 17–20, 69, 70, 73, 80, 81, 94–97) and invalid dates.

**What the library extracts:** date of birth, age, gender, place-of-birth code and name, serial, and `extra.bornAbroad`. Century: a serial starting 5–9 means 19YY; otherwise 20YY if that date is not in the future, else 19YY.

**Caveats:** The PB code is where the person was born, not citizenship; the library reports `bornAbroad` instead of labelling holders non-citizens (as idnumbers did). Codes 71/72 were catch-alls for births abroad before 2001. A few cards have a gender digit issued in error; JPN corrects them on request.

Sources: https://www.jpn.gov.my/my/kod-negeri, https://www.jpn.gov.my/my/kod-negara, https://en.wikipedia.org/wiki/Malaysian_identity_card, https://www.theborneopost.com/2017/11/09/womans-mykad-with-odd-number-for-last-digit-needs-to-be-corrected-immediately-says-voon/

## Mozambique (MZ)

### Número Único de Identificação Tributária — `MZ_NUIT`

Issued by: Autoridade Tributária de Moçambique · Holders: individuals and organisations · Check digit: weighted mod 11 · Confidence: low

**Format:** 9 digits, `T SSSSSSS C`, often written in groups of three. Example: `123 456 785`.

| Part | Meaning |
|---|---|
| `T` | Type of taxpayer (meaning of each value not published) |
| `SSSSSSS` | Sequential number |
| `C` | Check digit |

**Check digit:** Multiply the first 8 digits by 8, 9, 4, 5, 6, 7, 8, 9 and add. The remainder mod 11 is the check digit; a remainder of 10 is written as 1. Example `12345678`: 8 + 18 + 12 + 20 + 30 + 42 + 56 + 72 = 258; 258 mod 11 = 5, so the NUIT is `123456785`.

**What the library extracts:** sequential number (`serial`) and type digit (`extra.typeDigit`).

**Caveats:** The tax authority does not publish the algorithm. It comes from python-stdnum's documentation (implemented independently here), and matches that project's 78 valid samples (including its documented example `400339910`: sum 209, mod 11 = 0), so it is very likely right but has a single unofficial source.

Sources: https://www.at.gov.mz/por/Perguntas-Frequentes2/NUIT, https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.mz.nuit, https://lists.arthurdejong.org/python-stdnum-commits/2025/msg00027.html, https://org-id.guide/list/MZ-NUIT

## Namibia (NA)

### Namibian Identity Number — `NA_ID`

Issued by: Ministry of Home Affairs, Immigration, Safety and Security · Holders: citizens and permanent residents · Check digit: none known · Confidence: moderate

**Format:** 11 digits, `YYMMDD SSSSS`. Example: `850423 00123`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth; century not encoded |
| `SSSSS` | Serial among people born on that date |

**Check digit:** None known. The Identification Act 21 of 1996 (s.4) only says the number has eleven figures. The library checks the length and that the first six digits are a valid past date.

**What the library extracts:** date of birth (latest century that gives a past date), age, serial.

**Caveats:** No official document gives the positions. A UN ESCAP CRVS case study says the number is "a logical construct based on date of birth"; the library's YYMMDD reading comes from comparing about 1,000 Government Gazette estate notices that print both birth date and ID number (99% match). The last five digits matched no common check-digit scheme. Older 13-digit South West Africa numbers are not modelled. The planned e-ID / Civil Registration and Identification Act introduces a new unique number reportedly not linked to the date of birth; such numbers may fail the date check.

Sources: https://www.lac.org.na/laws/annoSTAT/Identification%20Act%2021%20of%201996.pdf, https://crvs.unescap.org/sites/default/files/resources/Case%20Study_Namibia.pdf, https://unstats.un.org/legal-identity-agenda/documents/Paper/2023/CRVSID-Namibia.pdf, https://www.lac.org.na/laws/2014/5627.pdf, https://itweb.africa/article/namibia-expedites-electronic-ids-issuance/j5alr7QApo87pYQk

## Nigeria (NG)

### Nigerian National Identification Number — `NG_NIN`

Issued by: National Identity Management Commission (NIMC) · Holders: citizens and legal residents · Check digit: none published · Confidence: moderate

**Format:** 11 digits, randomly assigned at enrolment; encodes nothing about the holder. Example: `12345678901`.

**Check digit:** None published by NIMC. The library checks only that the input is 11 digits.

**What the library extracts:** nothing beyond the shape.

**Caveats:** One verification vendor's documentation claims the last digit is a Verhoeff checksum; no NIMC source confirms this, so the library does not apply it.

Sources: https://nimc.gov.ng/about-nin/, https://en.wikipedia.org/wiki/National_identification_number#Nigeria, https://ncc.gov.ng/node/736

## Nicaragua (NI)

### Cédula de Identidad — `NI_CEDULA`

Issued by: Consejo Supremo Electoral (CSE) · Holders: citizens aged 16 and over · Check digit: mod 23 letter · Confidence: moderate

**Format:** 14 characters, `MMM-DDMMYY-NNNNL`. Example: `001-010190-0001N`.

| Part | Meaning |
|---|---|
| `MMM` | Municipality of birth (000 is rejected) |
| `DDMMYY` | Date of birth; century not encoded |
| `NNNN` | Running number among people born the same day in the same municipality |
| `L` | Check letter |

**Check digit:** Read the first 13 digits as one integer and take it mod 23. The remainder indexes the alphabet `ABCDEFGHJKLMNPQRSTUVWXY` (no I, O, Z), starting at 0 = A. Example: 0010101900001 mod 23 = 12, and position 12 is N.

**What the library extracts:** date of birth (latest past century), age, municipality code (`region`), running number (`serial`).

**Caveats:** CSE does not publish the check letter rule; it is community-documented and the library cross-checked it against five cédulas printed in official gazettes and the press. A redesigned card was introduced in February 2026; nothing found suggests the number changed.

Sources: https://www.cse.gob.ni/, https://gist.github.com/buster95/468e8053d8dc02e98d726a01cc47f061, https://bcn.gob.ni/sites/default/files/cursos_econ_finan/2020/indicadores%20macroeconomicos/Gaceta%20de%20Publicaci%C3%B3n.pdf

### Registro Único de Contribuyentes — `NI_RUC`

Issued by: Dirección General de Ingresos (DGI) · Holders: individuals and entities · Check digit: none for entities; cédula letter for individuals · Confidence: low

**Format:** 14 characters. Individuals use their cédula (13 digits + letter); legal entities get `J` + 13 digits. Example: `J0310000123456`.

**Check digit:** A person's RUC is validated as a cédula (mod 23 letter, date of birth). No check digit is published for the entity form, so `J` numbers and legacy 14-digit numbers are checked only for shape.

**What the library extracts:** `extra.kind` (person, entity, legacy); for person RUCs, the cédula fields.

**Caveats:** Not re-verified online beyond the cédula rule. nationid rejected `J` numbers; the library accepts them.

Sources: https://www.dgi.gob.ni/, https://lookuptax.com/docs/tax-identification-number/nicaragua-tax-id-guide

### Nicaraguan Passport Number — `NI_PASAPORTE`

Issued by: Dirección General de Migración y Extranjería · Holders: Nicaraguan citizens · Check digit: none known · Confidence: low

**Format:** an optional letter + 7 or 8 digits. Example: `C12345678`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.migob.gob.ni/migracion/, https://en.wikipedia.org/wiki/Nicaraguan_passport

## Netherlands (NL)

### Burgerservicenummer — `NL_BSN`

Issued by: Rijksdienst voor Identiteitsgegevens (RvIG), via municipalities · Holders: everyone registered in the BRP or RNI (residents and many non-residents) · Check digit: 11-proef · Confidence: high

**Format:** 9 digits, no internal meaning. Example: `1112.22.333`. Legacy systems sometimes drop a leading zero; the library pads 8 digits to 9.

**Check digit:** The "11-proef": 9·d1 + 8·d2 + 7·d3 + 6·d4 + 5·d5 + 4·d6 + 3·d7 + 2·d8 − 1·d9 must be divisible by 11. Example `111222333`: 9+8+7+12+10+8+9+6 = 69, minus 3 = 66 = 6 × 11. `000000000` is never issued.

**What the library extracts:** nothing; the BSN encodes nothing about the holder.

Sources: https://www.rvig.nl/burgerservicenummer, https://www.government.nl/topics/personal-data/citizen-service-number-bsn, https://nl.wikipedia.org/wiki/Burgerservicenummer

### Btw-identificatienummer — `NL_BTW`

Issued by: Belastingdienst · Holders: VAT-registered businesses · Check digit: 11-proef or MOD 97-10 · Confidence: moderate

**Format:** `NL` + 9 digits + `B` + 2 digits. Example: `NL123456789B13`.

| Part | Meaning |
|---|---|
| `NL` | Country code |
| 9 digits | Before 2020 (and still for legal entities): the RSIN/BSN. Since 1 January 2020 for sole traders: a number unrelated to the BSN |
| `B` + 2 digits | Sub-number; `B00` is not issued |

**Check digit:** Two schemes. Older and entity numbers: the 9 digits pass the BSN 11-proef. Sole-trader numbers issued since 2020: ISO 7064 MOD 97-10 over the whole string, with letters converted to 10–35 (N = 23, L = 21, B = 11); the result mod 97 must be 1. Example `NL123456789B13` → `23211234567891113`, which is 1 mod 97. The library accepts a number that passes either scheme.

**What the library extracts:** which scheme matched (`extra.scheme`).

**Caveats:** The Belastingdienst does not publish the mod-97 rule; business.gov.nl describes the last two digits of the new sole-trader btw-id as "random". The rule is the one applied by VIES-compatible validators. nationid applied mod 97 to the 9 digits only, which accepts invalid numbers and rejects valid ones. The separate omzetbelastingnummer (BSN + B + 2 digits) is not public and is not the btw-id.

Sources: https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/btw-id-controleren, https://ec.europa.eu/taxation_customs/vies/, https://business.gov.nl/regulations/using-checking-vat-numbers/

## Norway (NO)

### Fødselsnummer — `NO_FNR`

Issued by: Skatteetaten (Folkeregisteret) · Holders: people registered as residents of Norway · Check digit: two mod 11 digits · Confidence: high

**Format:** 11 digits, `DDMMYY III CC`. Example: `170540 26641`.

| Part | Meaning |
|---|---|
| `DDMMYY` | Date of birth |
| `III` | Individnummer; also encodes the century; its last digit is odd for men, even for women |
| `CC` | Two check digits |

Century from individnummer: 000–499 → 1900s; 500–749 with YY 54–99 → 1854–1899; 500–999 with YY 00–39 → 2000–2039; 900–999 with YY 40–99 → 1940–1999. Other combinations are unissued.

**Check digit:** k1 = 11 − (Σ first 9 digits × 3,7,6,1,8,9,4,5,2 mod 11); k2 = 11 − (Σ first 10 digits × 5,4,3,2,7,6,5,4,3,2 mod 11). A result of 11 becomes 0; 10 means the number is invalid. Example `170540266`: weighted sum 139, mod 11 = 7, k1 = 4; then sum over `1705402664` = 131, mod 11 = 10, k2 = 1 → `17054026641`.

**What the library extracts:** date of birth, age, gender, individnummer (`serial`).

**Caveats:** Skatteetaten has announced new number series from 2032 in which the individnummer will no longer show the century (and, per Skatteetaten, a new control calculation applies). The library implements the current rules. It rejects unissued individnummer/year combinations and future dates, which idnumbers accepts.

Sources: https://www.skatteetaten.no/en/person/national-registry/identitetsnummer/fodselsnummer/, https://lovdata.no/dokument/SF/forskrift/2017-07-14-1201, https://www.skatteetaten.no/en/deling/folkeregisteret/pid/validering/

### D-nummer — `NO_DNR`

Issued by: Skatteetaten · Holders: foreigners with a temporary connection to Norway · Check digit: two mod 11 digits · Confidence: high

**Format:** 11 digits, like a fødselsnummer but with 40 added to the day (so the first digit is 4–7). Example: `57054026635`.

**Check digit:** Same two mod 11 digits as the fødselsnummer.

**What the library extracts:** date of birth (day − 40), age, gender, individnummer; citizenship reported as foreigner.

Sources: https://www.skatteetaten.no/en/person/national-registry/identitetsnummer/d-nummer/, https://lovdata.no/dokument/SF/forskrift/2017-07-14-1201

### H-nummer — `NO_HNR`

Issued by: health sector (Norsk helsenett / local health services) · Holders: patients without a known fødselsnummer or D-nummer · Check digit: two mod 11 digits · Confidence: moderate

**Format:** 11 digits, like a fødselsnummer but with 40 added to the month (month field 41–52). Example: `17454026624`.

**Check digit:** Same two mod 11 digits.

**What the library extracts:** date of birth (month − 40), age, gender, individnummer.

**Caveats:** Not re-verified online.

Sources: https://ehelse.no/standardisering/standarder/identifikatorer-for-personer

### FH-nummer — `NO_FHN`

Issued by: health sector (felles hjelpenummer) · Holders: patients whose identity is unknown · Check digit: two mod 11 digits · Confidence: moderate

**Format:** 11 digits, first digit 8 or 9; no date or sex encoded. Example: `81234567802`.

**Check digit:** Same two mod 11 digits as the fødselsnummer.

**What the library extracts:** nothing beyond validity.

**Caveats:** Not re-verified online.

Sources: https://ehelse.no/standardisering/standarder/identifikatorer-for-personer

## Nepal (NP)

### Nepal National Identity Number — `NP_NIN`

Issued by: Department of National ID and Civil Registration (DoNIDCR) · Holders: citizens; since March 2024 also assigned at birth registration · Check digit: none published · Confidence: low

**Format:** 10 digits, no published structure. Example: `1234567890`.

**Check digit:** None published. The library checks only that the input is 10 digits.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Do not confuse the NIN with the 16-digit enrolment/application number used for SMS lookups. idnumbers expected 11 digits (it cited Nigeria's NIMC page); Nepal's NIN is 10.

Sources: https://donidcr.gov.np/, https://lawalpine.com/blog/national-id-registration-in-nepal, https://myrepublica.nagariknetwork.com/news/national-identification-number-to-be-provided-at-time-of-birth-registration

## Nauru (NR)

### Nauru Taxpayer Identification Number — `NR_TIN`

Issued by: Nauru Revenue Office · Holders: individuals and entities · Check digit: none known · Confidence: high

**Format:** 9 digits generated by the TIN registration database, shown as `123-456-789`. Example: `123456789`.

**Check digit:** None described. The library checks only that the input is 9 digits.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online (the OECD sheet could not be read in this pass); the description follows the module, which cites the issuer's OECD TIN sheet.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/nauru-tin.pdf

## New Zealand (NZ)

### IRD Number — `NZ_IRD`

Issued by: Inland Revenue (Te Tari Taake) · Holders: individuals and entities · Check digit: weighted mod 11 · Confidence: high

**Format:** 8 or 9 digits (an 8-digit number is a 7-digit base + check, often written with a leading 0). Example: `49-091-850`.

**Check digit:** Per Inland Revenue's payroll specification: (1) the number must be between 10,000,000 and 200,000,000; (2) drop the check digit and left-pad the base to 8 digits; (3) multiply by 3,2,7,6,5,4,3,2, add, take the remainder mod 11; check = 0 if the remainder is 0, else 11 − remainder; (4) if that gives 10, redo with weights 7,4,3,2,5,2,7,6; 10 again means invalid. Example `04909185`: sum 154, 154 mod 11 = 0, check 0 → `49091850`.

**What the library extracts:** nothing beyond validity. Out-of-range numbers fail as `invalid_range`.

**Caveats:** Inland Revenue raised the upper limit from 150,000,000 to 200,000,000 in 2026 (ird.govt.nz news, 10 February 2026). Specs before the 2026 edition, and sources built on them (python-stdnum, Oracle docs), still use 150,000,000.

Sources: https://www.ird.govt.nz/updates/news-folder/2026/increase-to-ird-number-validation-upper-limit, https://www.ramco.com/hubfs/compliance-portal/payroll-calculations-and-business-rules-specification-2026-v8.pdf, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/new-zealand-tin.pdf, https://www.ird.govt.nz/managing-my-tax/ird-numbers

### National Health Index Number — `NZ_NHI`

Issued by: Health New Zealand – Te Whatu Ora · Holders: anyone who uses NZ health services · Check digit: mod 11 (old) or mod 23 (new) · Confidence: high

**Format:** 7 characters. Old `LLLNNNC` (3 letters, 3 digits, check digit), e.g. `ZAC5361`; new `LLLNNLX` (3 letters, 2 digits, letter, check letter). Letters exclude I and O.

**Check digit:** Letters map A=1 … Z=24 (skipping I, O); digits keep their value. Multiply the first six characters by 7,6,5,4,3,2 and add.
- Old: remainder mod 11; 0 is invalid; check = 11 − remainder, with 10 written as 0. Example `ZAC536`: 24·7 + 1·6 + 3·5 + 5·4 + 3·3 + 6·2 = 230, 230 mod 11 = 10, check 1 → `ZAC5361`.
- New: remainder mod 23; 0 is invalid; check letter is the (23 − remainder)-th letter of the 24-letter alphabet. Example `ZZZ00A`: sum 434, mod 23 = 20, 3rd letter = C → `ZZZ00AC`. HISO 10046:2023 changed the modulus from 24 to 23.

**What the library extracts:** format (old/new) and whether it is a test NHI (starting with Z).

**Caveats:** The new format went live on 1 July 2026 and is only issued once the old series is exhausted; systems must accept both indefinitely.

Sources: https://www.tewhatuora.govt.nz/for-health-providers/claims-provider-payments-and-entitlements/nhi-number-format-changes, https://www.health.govt.nz/publication/hiso-10046-consumer-health-identity-standard, https://en.wikipedia.org/wiki/NHI_Number

### New Zealand Business Number — `NZ_NZBN`

Issued by: Ministry of Business, Innovation and Employment (NZBN register) · Holders: companies and other businesses · Check digit: GS1 mod 10 · Confidence: high

**Format:** 13 digits; a GS1 Global Location Number starting with `94`. Example: `9429041000014`.

**Check digit:** Standard GS1: from the rightmost digit of the 12-digit body, multiply alternately by 3 and 1, add, and check = (10 − sum mod 10) mod 10. Example `942904100001`: sum 66, check 4.

**What the library extracts:** nothing beyond validity.

**Caveats:** Not re-verified online; GS1 rule is standard.

Sources: https://www.nzbn.govt.nz/whats-an-nzbn/about/, https://gs1nz.org/sectors/government/nzbn, https://www.gs1.org/services/how-calculate-check-digit-manually

### Driver Licence Number — `NZ_DL`

Issued by: NZ Transport Agency Waka Kotahi · Holders: licensed drivers · Check digit: none known · Confidence: moderate

**Format:** two letters + six digits. Example: `AB123456`.

**Check digit:** None. The library checks only the pattern. New Zealand has no national identity number; this and the passport are the common photo IDs.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.nzta.govt.nz/driver-licences/getting-a-licence/your-licence-card/, https://en.wikipedia.org/wiki/National_identification_number#New_Zealand

## Oman (OM)

### Omani VAT Tax Identification Number — `OM_VAT`

Issued by: Oman Tax Authority · Holders: VAT- and excise-registered businesses · Check digit: none known · Confidence: moderate

**Format:** `OM` + 10 digits (12 characters). Example: `OM1100012345`.

**Check digit:** None published. The library checks only the pattern.

**What the library extracts:** the 10 digits (`serial`).

**Caveats:** The Tax Authority's OECD sheet only says "12 alphabetic-numeric characters"; the `OM` + 10 digits layout comes from secondary sources. One of them notes that some valid VATINs end in `X`, which the library's pattern would reject. The civil number and entity tax card number are not covered (no sourced length or rule).

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Oman-TIN.pdf, https://lookuptax.com/validate/oman/vat

## Panama (PA)

### Cédula de Identidad Personal — `PA_CEDULA`

Issued by: Tribunal Electoral (Dirección Nacional de Cedulación) · Holders: citizens and foreign residents · Check digit: none · Confidence: moderate

**Format:** `TIPO-TOMO-ASIENTO`, with variable-length parts, so the dashes are kept. Example: `8-1234-123456`.

| Part | Meaning |
|---|---|
| `TIPO` | 1–13 = province/comarca of registration (1 Bocas del Toro … 8 Panamá … 13 Panamá Oeste); `nAV` = registered before the civil registry law; `nPI` = indigenous registration; `PE` = Panamanian born abroad; `E` = foreign resident; `N` = naturalised |
| `TOMO` | Register volume, 1–4 digits |
| `ASIENTO` | Entry in that volume, 1–6 digits |

**Check digit:** None. The library checks the pattern.

**What the library extracts:** province/comarca code and name, citizenship (citizen, foreigner, naturalised), kind of registration, tomo and asiento.

**Caveats:** The prefixes weren't re-verified online; no authoritative Tribunal Electoral page on them was found. The OECD Panama TIN sheet confirms the 1–13 province prefix and the variable-length parts (a natural person's RUC is their cédula number). The former Wikipedia source now returns 404 and was removed.

Sources: https://www.tribunal-electoral.gob.pa/, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/panama-tin.pdf

### Registro Único de Contribuyentes — `PA_RUC`

Issued by: Dirección General de Ingresos (DGI) · Holders: individuals and legal entities · Check digit: DGI "DV" exists but is unpublished · Confidence: low

**Format:** Natural persons use their cédula. Legal persons use either the old `TOMO-FOLIO-ASIENTO` or, since 2014, `FOLIO_REAL-2-YYYY` (companies) / `FOLIO_REAL-3-YYYY` (foundations, associations). Example: `PE-1234-123456`.

**Check digit:** DGI prints a 2-digit "DV" next to the RUC, but its formula is not published. The library drops a trailing "DV nn" and does not verify it; it checks only the pattern.

**What the library extracts:** for cédula-form RUCs, the cédula fields and `holderType: natural_person`; for Folio Real RUCs, the folio (`serial`), entity class and registration year. A purely numeric `n-n-n` value is ambiguous (cédula or old company RUC) and is not labelled.

**Caveats:** Not re-verified online. nationid rejected the post-2014 Folio Real format; the library accepts it.

Sources: https://dgi.mef.gob.pa/Preguntas/ruc, https://dgi.mef.gob.pa/Dv

### Panamanian Passport Number — `PA_PASAPORTE`

Issued by: Autoridad de Pasaportes de Panamá · Holders: Panamanian citizens · Check digit: none known · Confidence: low

**Format:** up to two letters + 6–8 digits. Example: `PA12345678`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.pasaportes.gob.pa/

## Peru (PE)

### Documento Nacional de Identidad — `PE_DNI`

Issued by: RENIEC · Holders: Peruvian citizens · Check digit: printed but unpublished · Confidence: moderate

**Format:** 8 digits, no internal meaning. Example: `12345678`.

**Check digit:** The card prints a verification character after the number, but RENIEC does not publish how it is computed, and the number is normally quoted as the 8 digits alone. The library checks only the shape.

**What the library extracts:** the number (`serial`).

Sources: https://www.gob.pe/reniec, https://en.wikipedia.org/wiki/National_identification_number#Peru

### Registro Único de Contribuyentes — `PE_RUC`

Issued by: SUNAT · Holders: individuals and entities · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 11 digits, `TT NNNNNNNN C`. Example: `20-13131295-5`.

| Part | Meaning |
|---|---|
| `TT` | Taxpayer type: 10 = person with DNI (`natural_person_dni`), 15 = person with another ID (`natural_person_other_id`), 16 = no longer issued (`legacy`), 17 = old RUC from 1993–2000 or foreigner/other (`legacy_or_foreigner`), 20 = legal entity (`legal_entity`) |
| `NNNNNNNN` | For 10: the holder's DNI; otherwise a sequence |
| `C` | Check digit |

**Check digit:** Multiply the first 10 digits by 5,4,3,2,7,6,5,4,3,2 and add. c = 11 − (sum mod 11); if c = 10 the digit is 0, if c = 11 it is 1. Example `2013131295`: sum 94, 94 mod 11 = 6, 11 − 6 = 5.

**What the library extracts:** taxpayer kind, the 8-digit body (`serial`), and the embedded DNI for prefix 10.

**Caveats:** nationid swapped the 10/11 mapping; the library uses SUNAT's rule. The 16/17 labels follow Oracle's documentation (16 no longer issued; 17 covers 1993–2000 or foreign registrations); earlier versions labelled both `non_domiciled`. Oracle's example `20503644968` is valid and `20503644961` fails the check digit.

Sources: https://orientacion.sunat.gob.pe/ruc-empresas, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Peru-TIN.pdf, https://lookuptax.com/docs/es/numero-identificacion-fiscal/guia-ruc-peru, https://docs.oracle.com/en/cloud/saas/financials/24a/faitx/peru.html

### Carné de Extranjería — `PE_CE`

Issued by: Superintendencia Nacional de Migraciones · Holders: foreign residents · Check digit: none known · Confidence: low

**Format:** 9–12 digits. Example: `000001234567`.

**Check digit:** None published. The library checks only length.

**What the library extracts:** citizenship = foreigner.

**Caveats:** Not re-verified online.

Sources: https://www.gob.pe/migraciones

### Peruvian Passport Number — `PE_PASAPORTE`

Issued by: Superintendencia Nacional de Migraciones · Holders: Peruvian citizens · Check digit: none known · Confidence: low

**Format:** an optional letter + 8 or 9 digits. Example: `A123456789`.

**Check digit:** None on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape.

**Caveats:** Not re-verified online.

Sources: https://www.gob.pe/migraciones, https://es.wikipedia.org/wiki/Pasaporte_peruano

## Papua New Guinea (PG)

### Papua New Guinea National Identification Number — `PG_NID`

Issued by: PNG Civil and Identity Registry (PNGCIR) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 10 digits, no published structure. Example: `1234567890`.

**Check digit:** None published. The library checks only that the input is 10 digits.

**What the library extracts:** nothing beyond the shape.

**Caveats:** The 10-digit length could not be confirmed from a PNGCIR source; it comes from idnumbers and Wikipedia. The Civil and Identity Registration Act 2024 replaced the 1963 law; it is not known whether it changes the number.

Sources: https://en.wikipedia.org/wiki/National_identification_number#Papua_New_Guinea, https://www.pngcir.gov.pg

## Philippines (PH)

### PhilSys Number — `PH_PSN`

Issued by: Philippine Statistics Authority (PSA) · Holders: citizens and resident aliens registered in PhilSys · Check digit: none published · Confidence: moderate

**Format:** 12 digits, randomly generated and permanent. Example: `1234-5678901-2`.

**Check digit:** None published. The library checks only that the input is 12 digits.

**What the library extracts:** nothing; the PSN encodes no personal data.

**Caveats:** The PSN is confidential (microprinted on the back of the card); PSA tells holders to use the PCN in transactions.

Sources: https://psa.gov.ph/content/psa-begins-issuance-psn-and-philid-successful-registrants, https://www.officialgazette.gov.ph/2018/08/06/republic-act-no-11055/, https://en.wikipedia.org/wiki/Philippine_national_identity_card

### PhilSys Card Number — `PH_PCN`

Issued by: Philippine Statistics Authority (PSA) · Holders: PhilID card holders · Check digit: none published · Confidence: moderate

**Format:** 16 digits printed on the front of the PhilID. Example: `1234-5678-9012-3456`.

**Check digit:** None published. PSA describes the PCN as a public, replaceable token derived from the PSN and valid for the life of the card; how it is derived is not published. The library checks only that the input is 16 digits.

**What the library extracts:** nothing beyond the shape.

Sources: https://psa.gov.ph/content/psa-bsp-promote-philid-card-security-and-verification-features, https://psa.gov.ph/content/psa-begins-issuance-psn-and-philid-successful-registrants, https://www.officialgazette.gov.ph/2018/08/06/republic-act-no-11055/, https://en.wikipedia.org/wiki/Philippine_national_identity_card

## Pakistan (PK)

### Computerised National Identity Card Number — `PK_CNIC`

Issued by: National Database and Registration Authority (NADRA) · Holders: citizens aged 18+ (also printed on NICOP for overseas Pakistanis) · Check digit: none published · Confidence: moderate

**Format:** 13 digits, `PDDDT-FFFFFFF-G`. Example: `35202-1234567-1`.

| Part | Meaning |
|---|---|
| `P` | Province/territory: 1 Khyber Pakhtunkhwa, 2 FATA (now part of KP), 3 Punjab, 4 Sindh, 5 Balochistan, 6 Islamabad, 7 Gilgit-Baltistan, 8 Azad Jammu and Kashmir |
| `PDDDT` | Registration locality: province, division, district, tehsil/union council |
| `FFFFFFF` | Family/serial number |
| `G` | Odd for male, even for female |

**Check digit:** None published. The library rejects a first digit of 0 or 9 (not province codes) and otherwise checks only length.

**What the library extracts:** gender, province code and name, 5-digit locality (`extra.locality`), 7-digit serial.

**Caveats:** Some sources (Wikipedia, press) call the last digit a "check digit" while also saying it gives the sex; no algorithm has been published, so the library treats it as the sex digit only. The digit layout comes from press reports quoting NADRA, not a NADRA specification.

Sources: https://www.nadra.gov.pk/identity/identity-cnic/, https://en.wikipedia.org/wiki/CNIC_(Pakistan), https://tribune.com.pk/story/1403682/theres-cnic-number-know

## Poland (PL)

### PESEL — `PL_PESEL`

Issued by: Ministry of Digital Affairs (central population register, PESEL register) · Holders: citizens and foreigners registered in Poland · Check digit: weighted mod 10 · Confidence: high

**Format:** 11 digits, `YYMMDD ZZZX Q`. Example: `800101 1234 0`.

| Part | Meaning |
|---|---|
| `YY` | Last two digits of the birth year |
| `MM` | Birth month plus a century offset: 81–92 → 1800s, 01–12 → 1900s, 21–32 → 2000s, 41–52 → 2100s, 61–72 → 2200s |
| `DD` | Day of birth |
| `ZZZ` | Serial |
| `X` | Sex digit: odd = male, even = female |
| `Q` | Check digit |

**Check digit:** multiply the first ten digits by 1, 3, 7, 9, 1, 3, 7, 9, 1, 3 and sum. Q = (10 − sum mod 10) mod 10. For `8001011234`: 8+0+0+9+0+3+7+18+3+12 = 60, so Q = (10 − 0) mod 10 = 0.

**What the library extracts:** date of birth, age, gender, serial (`ZZZX`).

**Caveats:** the library rejects impossible dates (30 February) and future birth dates, so the 2100s/2200s offsets are accepted by the pattern but fail as `invalid_date` today.

Sources: https://www.gov.pl/web/gov/czym-jest-numer-pesel, https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20100170087, https://en.wikipedia.org/wiki/PESEL

### Tax Identification Number (NIP) — `PL_NIP`

Issued by: tax offices (Krajowa Administracja Skarbowa) · Holders: companies and individuals running a business · Check digit: weighted mod 11 · Confidence: high

**Format:** 10 digits, usually written `XXX-XXX-XX-XX`. Example: `123-456-32-18`.

| Part | Meaning |
|---|---|
| first 3 digits | Code of the tax office that issued the number |
| next 6 digits | Serial |
| last digit | Check digit |

**Check digit:** multiply the first nine digits by 6, 5, 7, 2, 3, 4, 5, 6, 7 and take the sum mod 11. The result is the check digit; a remainder of 10 is never issued, so such numbers are invalid. For `123456321`: 6+10+21+8+15+24+15+12+7 = 118, 118 mod 11 = 8.

**What the library extracts:** the tax-office prefix (as `region`).

Sources: https://www.podatki.gov.pl/nip/, https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19951420702

### REGON — `PL_REGON`

Issued by: Statistics Poland (GUS) · Holders: companies, sole traders and their local units · Check digit: weighted mod 11 · Confidence: high

**Format:** 9 digits for an entity, or 14 digits for a local unit (the parent's 9 digits + 4-digit unit number + check digit). Example: `123456785`.

**Check digit:**
- 9-digit: multiply the first eight digits by 8, 9, 2, 3, 4, 5, 6, 7, sum, take mod 11; a remainder of 10 becomes 0. For `12345678`: sum 192, 192 mod 11 = 5.
- 14-digit: the first nine digits must be a valid 9-digit REGON, and the 14th digit is computed the same way over the first 13 digits with weights 2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8.

**What the library extracts:** whether the number is a local unit (14 digits).

Sources: https://bip.stat.gov.pl/dzialalnosc-statystyki-publicznej/rejestr-regon/, https://wyszukiwarkaregon.stat.gov.pl/

## Palestine (PS)

### Palestinian Identity Number — `PS_ID`

Issued by: Palestinian Ministry of Interior, from the population registry shared with the Israeli Civil Administration · Holders: Palestinian residents of the West Bank and Gaza · Check digit: Luhn · Confidence: moderate

**Format:** 9 digits, 8-digit serial + check digit, first digit 1–9. Example: `40000000-6`. The number encodes nothing about the holder.

**Check digit:** the Luhn algorithm, the same scheme as the Israeli Teudat Zehut. Reading from the left, multiply digits by 1, 2, 1, 2, …; when a product exceeds 9 subtract 9; the total including the check digit must be a multiple of 10. For `400000006`: 4 + 0 + … + 0 + 6 = 10, which is valid.

**What the library extracts:** nothing beyond validity.

**Caveats:** Israel's use of Luhn is well documented; that Palestinian numbers use the same check rests on the shared-registry history and secondary sources. No Palestinian official specification was found.

Sources: https://en.wikipedia.org/wiki/Palestinian_identity_card, https://www.moi.pna.ps/, https://en.wikipedia.org/wiki/Israeli_identity_card

## Portugal (PT)

### Tax Identification Number (NIF / NIPC) — `PT_NIF`

Issued by: Autoridade Tributária e Aduaneira · Holders: individuals, companies and other entities · Check digit: weighted mod 11 · Confidence: high

**Format:** 9 digits; an optional `PT` VAT prefix is dropped. Example: `123 456 789`.

| Prefix | Holder type |
|---|---|
| `1`, `2`, `3` | Resident individual |
| `45` | Non-resident individual (income taxed only by final withholding) |
| `5` | Company (NIPC) |
| `6` | Public body |
| `70`, `74`, `75` | Undivided estate |
| `71` | Non-resident company (final withholding only) |
| `72` | Investment or pension fund |
| `77` | NIF assigned ex officio |
| `79` | Expo 98 exceptional regime |
| `8` | Sole trader (legacy, no longer assigned) |
| `90`, `91` | Condominium or irregular company |
| `98` | Non-resident without permanent establishment |
| `99` | Civil partnership without legal personality |

**Check digit:** multiply the first eight digits by 9, 8, 7, 6, 5, 4, 3, 2 and take the sum mod 11 = r. Check = 0 if r < 2, else 11 − r. For `12345678`: sum 156, 156 mod 11 = 2, check = 9.

**What the library extracts:** holder type and whether it is a person.

**Caveats:** prefixes not in the table (0, 4x other than 45, 73, 76, 78, 92–97) are rejected as `invalid_range`. Secondary sources label 70/74/75 slightly differently; all three are estates in the library.

Sources: https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Pages/faqs-00187.aspx, https://pt.wikipedia.org/wiki/N%C3%BAmero_de_identifica%C3%A7%C3%A3o_fiscal, https://diariodarepublica.pt/dr/detalhe/decreto-lei/14-2013-257001

### Citizen Card document number — `PT_CC`

Issued by: IRN, card system run by AMA · Holders: Portuguese citizens · Check digit: Luhn-style mod 10 over letters and digits · Confidence: moderate

**Format:** 12 characters, `NNNNNNNN C VV K`. Example: `00000000 0 ZZ4` (AMA's specimen).

| Part | Meaning |
|---|---|
| `NNNNNNNN` | Civil identification number (NIC) |
| `C` | Check digit of the NIC |
| `VV` | Card version, two letters/digits (`ZZ` = first card, `ZY` = second, …) |
| `K` | Document check digit |

**Check digit:** map 0–9 to 0–9 and A–Z to 10–35. Working from the rightmost character, double every second value and subtract 9 if the result exceeds 9; sum everything. The total must be a multiple of 10. For `000000000ZZ4`: 4 + (35×2 − 9 = 61) + 35 = 100.

**What the library extracts:** the 8-digit NIC (as `serial`) and the version code.

**Caveats:** the version changes with every new card, so two cards of one person share the NIC but not the full number. The library follows AMA's published rule; idnumbers' two mod-11 digits reject real cards.

Sources: https://www.autenticacao.gov.pt/documents/20126/0/Valida%C3%A7%C3%A3o+de+N%C3%BAmero+de+Documento+do+Cart%C3%A3o+de+Cidad%C3%A3o+(1).pdf, https://www.cartaodecidadao.pt/

## Paraguay (PY)

### Identity Card Number — `PY_CI`

Issued by: Departamento de Identificaciones, Policía Nacional · Holders: citizens and residents · Check digit: none known · Confidence: moderate

**Format:** 6–9 digits, written with dot separators. Example: `123.456.789`. A sequential number with no internal structure.

**Check digit:** none known; the library checks only length and digits.

**What the library extracts:** the number (as `serial`).

**Caveats:** an identity-verification vendor gives the range as 6–10 digits; no official statement of the length was found.

Sources: https://www.policianacional.gov.py/, https://en.wikipedia.org/wiki/Paraguayan_identity_card

### Taxpayer Registry Number (RUC) — `PY_RUC`

Issued by: DNIT (formerly SET) · Holders: individuals and entities · Check digit: mod 11 · Confidence: moderate

**Format:** base number + `-` + check digit, 7–10 digits in total. For people the base is their CI number; companies have 8-digit bases starting `80`. Example: `123456789-0`.

**Check digit:** multiply the base digits by 2, 3, 4, … starting from the rightmost digit (weights cycle back to 2 after 11), sum, and take r = sum mod 11. Check = 11 − r if r > 1, else 0. For `123456789`: 9×2 + 8×3 + 7×4 + 6×5 + 5×6 + 4×7 + 3×8 + 2×9 + 1×10 = 210, r = 1, check = 0.

**What the library extracts:** the base number (as `serial`).

**Caveats:** some very old RUCs contain a letter, which DNIT tools replace with its ASCII code; no official source confirms this, so the library rejects them. DNIT has not published the algorithm; the description comes from validator tools.

Sources: https://www.dnit.gov.py/, https://yo-facturo.com/herramientas/validador-ruc-paraguay/, https://lookuptax.com/docs/de/steuerliche-identifikationsnummer/paraguay-ruc-steuer-id

### Passport Number — `PY_PASAPORTE`

Issued by: Departamento de Identificaciones, Policía Nacional · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 6–9 letters/digits. Example: `A12345678`.

**Check digit:** none known on the printed number; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

Sources: https://www.policianacional.gov.py/

## Qatar (QA)

### Qatar ID Number (QID) — `QA_QID`

Issued by: Ministry of Interior · Holders: citizens and residents · Check digit: none known · Confidence: moderate

**Format:** 11 digits, `C YY NNN SSSSS`. Example: `284 634 00123`.

| Part | Meaning |
|---|---|
| `C` | Century of birth: 2 = 1900s, 3 = 2000s |
| `YY` | Last two digits of the birth year |
| `NNN` | Nationality, ISO 3166-1 numeric code (634 = Qatar) |
| `SSSSS` | Serial; 00000 is not issued |

**Check digit:** none published. The library checks the century digit, that the birth year is not in the future, that the nationality code is a known ISO numeric code, and that the serial is not 00000.

**What the library extracts:** birth year, citizenship (citizen when the code is 634, otherwise resident), nationality code, serial.

**Caveats:** all descriptions are from secondary guides and Microsoft's classifier documentation. Guides disagree on how the serial is assigned (order of residency vs. births per year). Microsoft lists a checksum field without describing one.

Sources: https://portal.moi.gov.qa/, https://learn.microsoft.com/en-us/purview/sit-defn-qatari-id-card-number, https://www.dohaguides.com/qatar-id-number/

## Romania (RO)

### Personal Numeric Code (CNP) — `RO_CNP`

Issued by: Directorate for Persons Records (DEPABD) via local civil-status offices · Holders: citizens, foreign residents, other foreigners with a fiscal need · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `S AA LL ZZ JJ NNN C`. Example: `1 800101 22 114 4`.

| Part | Meaning |
|---|---|
| `S` | Sex and century: 1/2 = 1900s, 3/4 = 1800s, 5/6 = 2000s (odd male, even female); 7/8 = foreign resident (male/female); 9 = other foreigner (no sex) |
| `AALLZZ` | Date of birth |
| `JJ` | County: 01–46 (40 Bucharest, 41–46 its sectors), 47/48 former sectors 7 and 8, 51 Călărași, 52 Giurgiu, 70 any county (numbers generated by the integrated IT system) |
| `NNN` | Sequence 001–999 |
| `C` | Check digit |

**Check digit:** multiply the first twelve digits by `2 7 9 1 4 6 3 5 8 2 7 9`, sum, take mod 11; a remainder of 10 becomes 1. For `180010122114`: sum 136, 136 mod 11 = 4.

**What the library extracts:** date of birth, age, gender (not for S = 9), citizenship (citizen / resident / foreigner), county code and name, serial.

**Caveats:** for S = 7/8/9 the century is not encoded; the library picks the latest year that gives a past date. County codes 80–83 appear only in independent validators and are accepted without a name; 99 and serial 000 are rejected.

Sources: https://ro.wikipedia.org/wiki/Cod_numeric_personal_(Rom%C3%A2nia), https://en.wikipedia.org/wiki/Romanian_identity_card

### Fiscal Identification Code (CUI / CIF) — `RO_VAT`

Issued by: ANAF / National Trade Register Office · Holders: legal entities · Check digit: weighted mod 11 · Confidence: high

**Format:** 2–10 digits, no leading zero; the last digit is the check digit. An `RO` prefix (VAT-registered) is optional and dropped. Example: `18547290`.

**Check digit:** pad the body (all digits but the last) on the left to 9 digits, multiply by 7, 5, 3, 2, 1, 7, 5, 3, 2 and sum. Check = (sum × 10 mod 11) mod 10. For body `1854729` → `001854729`: sum 111, 1110 mod 11 = 10, 10 mod 10 = 0.

**What the library extracts:** nothing beyond validity.

**Caveats:** not re-verified online in this pass.

Sources: https://www.anaf.ro/, https://ec.europa.eu/taxation_customs/vies/, https://en.wikipedia.org/wiki/VAT_identification_number

## Serbia (RS)

### Unique Master Citizen Number (JMBG) — `RS_JMBG`

Issued by: Ministry of Interior · Holders: citizens, and foreigners registered in Serbia · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `DD MM YYY RR BBB K`. Example: `0101990 71 000 8`. The same scheme is used across the former Yugoslavia.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth; `YYY` is the year without its first digit (9xx → 19xx, 0xx → 20xx, 8xx → 18xx) |
| `RR` | Political region of first registration (1978 SFRY allocation): 00/09 naturalised, 01–08 foreigners, 10–19 Bosnia and Herzegovina, 21–29 Montenegro, 30–39 Croatia, 41–49 North Macedonia, 50–59 Slovenia, 70–79 Central Serbia (71 Belgrade), 80–89 Vojvodina (80 Novi Sad), 91–96 Kosovo |
| `BBB` | Serial: 000–499 male, 500–999 female |
| `K` | Check digit |

**Check digit:** multiply the first twelve digits by 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 and sum. m = 11 − (sum mod 11). If m is 1–9, K = m; if m is 10 or 11, K = 0. For `010199071000`: sum 102, 102 mod 11 = 3, m = 8, K = 8.

**What the library extracts:** date of birth, age, gender, region code and name, register area (republic/province), serial, and `citizenship: foreigner` for codes 01–08.

**Caveats:** people who moved between republics before 1991 kept their number, so Serbian citizens can hold codes from other republics; the library accepts all allocated codes and rejects the unused 20, 40, 90 and 97–99. People born before 1976 got the code of where they lived then, not where they were born.

Sources: https://www.paragraf.rs/propisi/zakon-o-jedinstvenom-maticnom-broju-gradjana.html, https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number, https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345

## Russia (RU)

### Taxpayer Number, individual (INN) — `RU_INN`

Issued by: Federal Tax Service (FNS) · Holders: individuals · Check digit: two weighted mod 11 digits · Confidence: moderate

**Format:** 12 digits, `NNNN XXXXXX CC`. Example: `7701 123456 95`.

| Part | Meaning |
|---|---|
| `NNNN` | Code of the tax office that assigned the number; first two digits = region |
| `XXXXXX` | Serial in the Unified State Register of Taxpayers |
| `CC` | Two check digits |

**Check digit:** digit 11 = (Σ first ten digits × 7, 2, 4, 10, 3, 5, 9, 4, 6, 8) mod 11 mod 10. Digit 12 = (Σ first eleven digits × 3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8) mod 11 mod 10. For `770112345695`: 207 mod 11 = 9, then 269 mod 11 = 5.

**What the library extracts:** region, tax-office code, serial.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/russia-tin.pdf, https://www.nalog.gov.ru/eng/exchinf/inn/, https://ru.wikipedia.org/wiki/Идентификационный_номер_налогоплательщика

### Taxpayer Number, organisation (INN) — `RU_INN_ORG`

Issued by: Federal Tax Service (FNS) · Holders: Russian legal entities and registered units of foreign ones · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 10 digits, `NNNN XXXXX C`. Example: `7700 12345 9`. Foreign organisations use the prefix `9909`.

| Part | Meaning |
|---|---|
| `NNNN` | Tax-office code (first two digits = region); `9909` for foreign organisations |
| `XXXXX` | Serial |
| `C` | Check digit |

**Check digit:** (Σ first nine digits × 2, 4, 10, 3, 5, 9, 4, 6, 8) mod 11 mod 10. For `770012345`: 141 mod 11 = 9.

**What the library extracts:** region, tax-office code, serial, whether it is a foreign organisation.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/russia-tin.pdf, https://www.nalog.gov.ru/eng/exchinf/inn/

### Individual Insurance Account Number (SNILS) — `RU_SNILS`

Issued by: Social Fund of Russia (formerly Pension Fund) · Holders: insured individuals · Check digit: weighted sum mod 101 · Confidence: moderate

**Format:** 11 digits, `XXX-XXX-XXX CC`. Example: `123-456-789 64`. The nine-digit number is a serial; `CC` is a two-digit check number.

**Check digit:** multiply the nine digits by 9, 8, 7, …, 1 and sum. If the sum is below 100, CC is the sum; if it is 100 or 101, CC = 00; otherwise CC = sum mod 101 (100 again written 00). For `123456789`: 9+16+21+24+25+24+21+16+9 = 165, 165 mod 101 = 64.

**What the library extracts:** the nine-digit serial and whether the check number was verified.

**Caveats:** numbers up to `001-001-998` were issued before the check number existed; the library accepts them without checking `CC`.

Sources: https://sfr.gov.ru/grazhdanam/snils/, https://ru.wikipedia.org/wiki/Страховой_номер_индивидуального_лицевого_счёта

### Internal Passport Number — `RU_PASSPORT`

Issued by: Ministry of Internal Affairs (MVD) · Holders: citizens aged 14 and over · Check digit: none known · Confidence: low

**Format:** 10 digits, series `SS YY` + number `NNNNNN`. Example: `45 09 123456`.

| Part | Meaning |
|---|---|
| `SS` | Region (OKATO code) where the passport was issued |
| `YY` | Last two digits of the year the blank was printed |
| `NNNNNN` | Passport number |

**Check digit:** none; the library checks only length and pattern, and rejects series `0000` and number `000000`.

**What the library extracts:** region, series, blank year, number (as `serial`).

**Caveats:** not re-verified online in this pass.

Sources: https://en.wikipedia.org/wiki/Russian_internal_passport, https://www.gosuslugi.ru/

## Rwanda (RW)

### National Identity Number — `RW_NID`

Issued by: National Identification Agency (NIDA) · Holders: citizens, refugees and foreigners · Check digit: unpublished ("security code") · Confidence: low

**Format:** 16 digits, `S YYYY G NNNNNNN I CC`. Example: `1 1990 8 0000001 0 12`.

| Part | Meaning |
|---|---|
| `S` | Holder status (citizen, refugee or foreigner); which digit means which is not published |
| `YYYY` | Year of birth |
| `G` | Gender: 8 = male, 7 = female |
| `NNNNNNN` | Birth-order sequence |
| `I` | Number of times an ID has been issued to the holder |
| `CC` | Security code |

**Check digit:** the two-digit security code's algorithm is not published, so the library checks only the shape and that the birth year is not in the future.

**What the library extracts:** birth year, gender, serial, raw status digit, issue count, security code.

**Caveats:** the layout comes from one news article (KT Press, 2025); no NIDA specification was found. The same article reports that NIDA sometimes issues a new number for a corrected or replaced card.

Sources: https://www.ktpress.rw/2025/06/why-are-rwandans-getting-multiple-national-id-numbers-auditor-general-points-to-a-system-flaw/, https://www.nida.gov.rw/

## Saudi Arabia (SA)

### National ID Number — `SA_NIN`

Issued by: Ministry of Interior (National Information Center) · Holders: Saudi citizens · Check digit: Luhn · Confidence: moderate

**Format:** 10 digits, `1 NNNNNNNN C`. Example: `1000000008`.

| Part | Meaning |
|---|---|
| `1` | Holder type: Saudi citizen |
| `NNNNNNNN` | Serial, 00000000–99999999 |
| `C` | Check digit |

The Saudi Central Bank rulebook confirms the first digit (1 = citizen, 2 = resident) and the digits 2–9 serial. It also lists 3/5 (visitors), 6 (pilgrims) and 7 (entities), which the library does not model.

**Check digit:** Luhn over all ten digits: from the left, double the 1st, 3rd, 5th, 7th and 9th digits (subtract 9 if over 9), add the rest; the total must be a multiple of 10. For `1000000008`: 2 + 0 + … + 8 = 10.

**What the library extracts:** citizenship (citizen), serial. No birth date or gender is encoded.

**Caveats:** the Saudi Central Bank rulebook says the check-digit formula is given out by the National Information Center on request and is not published. The Luhn rule comes from community validators and has not been confirmed by the issuer, so confidence stays moderate.

Sources: https://www.absher.sa/, https://www.my.gov.sa/en/content/national-id, https://en.wikipedia.org/wiki/Saudi_national_identity_card, https://rulebook.sama.gov.sa/en/entiresection/2324

### Resident Identity Number (Iqama) — `SA_IQAMA`

Issued by: Ministry of Interior (Jawazat / National Information Center) · Holders: foreign residents · Check digit: Luhn · Confidence: moderate

**Format:** 10 digits, `2 NNNNNNNN C`. Example: `2123456788`. The leading `2` marks a foreign resident; the rest is a serial and a Luhn check digit, exactly as for `SA_NIN`. The same number is used as the resident's "computer number".

**Check digit:** Luhn, as above. For `2123456788`: 4+1+4+3+8+5+3+7+7+8 = 50.

**What the library extracts:** citizenship (resident), serial.

**Caveats:** same as `SA_NIN`: the official formula is not published, and Luhn comes from community validators, not the issuer.

Sources: https://www.absher.sa/, https://www.my.gov.sa/en/content/national-id, https://rulebook.sama.gov.sa/en/entiresection/2324

## Seychelles (SC)

### Taxpayer Identification Number — `SC_TIN`

Issued by: Seychelles Revenue Commission (SRC) · Holders: individuals in business and entities (any "person" liable for revenue under s. 35 of the Revenue Administration Act 2009; employees are not issued one) · Check digit: unpublished · Confidence: low

**Format:** 9 digits, written `NNN NNN NNN`. Example: `961 900 106`. Randomly generated by SRC's system; no internal structure.

**Check digit:** the OECD TIN sheet says the generating algorithm "ensures that it meets a checksum requirement", but the checksum is not published. The library checks only length and digits.

**What the library extracts:** nothing beyond validity.

**Caveats:** the national identity number is not modelled; no published format was found.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Seychelles-TIN.pdf, https://lookuptax.com/validate/seychelles/tin

## Sweden (SE)

### Personal Identity Number (personnummer) — `SE_PERSONNUMMER`

Issued by: Skatteverket (Swedish Tax Agency) · Holders: everyone registered in the population register · Check digit: Luhn · Confidence: high

**Format:** `YYMMDD-NNNC` (10 digits), or `YYYYMMDDNNNC` (12 digits). Example: `811228-9874`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth |
| separator | `-` (or none) under 100 years old; `+` from the year the holder turns 100 |
| `NNN` | Birth number; the last of the three is odd for men, even for women |
| `C` | Check digit |

**Check digit:** Luhn over the 10-digit form (century never included). Multiply the nine digits by 2, 1, 2, 1, …, add the digits of each product, and C = (10 − sum mod 10) mod 10. For `811228987`: 7+1+2+2+4+8+9+8+5 = 46, C = 4.

**What the library extracts:** date of birth, age, gender, birth number (as `serial`).

**Caveats:** with 10 digits the century is inferred from the separator and the reference date; a 10-digit number without a separator is read as `-`. 12-digit forms must be 18xx–20xx and a past date.

Sources: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/, https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html, https://en.wikipedia.org/wiki/Personal_identity_number_(Sweden)

### Coordination Number (samordningsnummer) — `SE_SAMORDNINGSNUMMER`

Issued by: Skatteverket · Holders: people who are not, or have not been, registered in the population register (e.g. foreign workers, students) · Check digit: Luhn · Confidence: high

**Format:** same as the personnummer, but the day of birth has 60 added (61–91). Example: `701063-2391` (born 3 October 1970).

**Check digit:** Luhn over the 10-digit form, exactly as for the personnummer (the day is used with the +60 included).

**What the library extracts:** date of birth (day − 60), age, gender, serial, and `kind: samordningsnummer`.

Sources: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20221697-om-samordningsnummer_sfs-2022-1697/, https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html

### Organisation Number — `SE_ORGNR`

Issued by: Bolagsverket, Skatteverket, SCB and others depending on legal form · Holders: legal entities · Check digit: Luhn · Confidence: high

**Format:** 10 digits, `NNNNNN-NNNC`. Example: `202100-5489`. The third digit is always 2 or higher, which separates it from a personnummer (where the third digit starts a month).

| First digit | Legal-form group |
|---|---|
| 1 | Estate |
| 2 | State, county, municipality, parish |
| 3 | Foreign company |
| 5 | Limited company |
| 6 | Simple partnership |
| 7 | Economic association, housing cooperative |
| 8 | Non-profit association, foundation |
| 9 | Trading or limited partnership |

**Check digit:** Luhn over all ten digits. For `2021005489`, the weighted digit sum is 30.

**What the library extracts:** legal-form group.

Sources: https://bolagsverket.se/foretag/organisationsnummer.1207.html, https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1974174-om-identitetsbeteckning-for_sfs-1974-174/

### VAT Number — `SE_VAT`

Issued by: Skatteverket · Holders: VAT-registered businesses, including sole traders · Check digit: Luhn · Confidence: high

**Format:** `SE` + 10 digits + `01`, 14 characters. Example: `SE202100548901`. The 10 digits are the organisationsnummer, or for a sole trader the owner's personnummer.

**Check digit:** Luhn over the 10 middle digits. If the third digit is below 2, the 10 digits must also form a valid personnummer or samordningsnummer date.

**What the library extracts:** holder type (organisation or sole trader).

Sources: https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/forsaljningtillandraeulander/kontrolleramomsregistreringsnummervatnummer/momsregistreringsnummer.4.18e1b10334ebe8bc80002649.html, https://ec.europa.eu/taxation_customs/vies/

## Singapore (SG)

### NRIC Number — `SG_NRIC`

Issued by: Immigration & Checkpoints Authority (ICA) · Holders: citizens and permanent residents · Check digit: weighted mod 11 letter · Confidence: high

**Format:** 9 characters, `P NNNNNNN L`. Example: `S1234567D`.

| Part | Meaning |
|---|---|
| `P` | `S` registered before 2000, `T` from 2000 |
| `NNNNNNN` | Serial; for citizens born in Singapore from 1968 it starts with the birth year |
| `L` | Check letter |

**Check digit:** multiply the seven digits by 2, 7, 6, 5, 4, 3, 2 and sum; add 4 for `T` (0 for `S`); take mod 11 and index (from 0) into `JZIHGFEDCBA`. For `S1234567`: sum 106, 106 mod 11 = 7 → `D`.

**What the library extracts:** serial, series letter. No birth year: permanent residents and older citizens don't follow the year-of-birth pattern.

**Caveats:** Per the OECD sheet, numbers of people born in 1967 or earlier commonly start with 0 or 1; people born before 1967 who later became permanent residents or citizens got leading digits 2 or 3, and those becoming permanent residents or citizens after 2008 get 4 or 5.

Sources: https://sso.agc.gov.sg/Act/NRA1965, https://www.ica.gov.sg/reside, https://en.wikipedia.org/wiki/National_Registration_Identity_Card, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf

### Foreign Identification Number (FIN) — `SG_FIN`

Issued by: ICA / Ministry of Manpower · Holders: foreigners on long-term passes (work, student, dependant) · Check digit: weighted mod 11 letter · Confidence: high

**Format:** 9 characters, `P NNNNNNN L`. Example: `M5012345J`. `F` = issued before 2000, `G` = 2000–2021, `M` = from 1 January 2022.

**Check digit:** same weights as the NRIC. Offset 0 for `F`, 4 for `G`, 3 for `M`; mod 11; index into `XWUTRQPNMLK` (F/G) or `XWUTRQPNJLK` (M). For `M5012345`: 60 + 3 = 63, 63 mod 11 = 8 → `J`.

**What the library extracts:** serial, series letter, `citizenship: foreigner`.

**Caveats:** the M-series offset and table are not published by ICA; they are derived from issued numbers.

Sources: https://www.ica.gov.sg/news-and-publications/media-releases/media-release/new-m-fin-series-to-be-introduced-from-1-january-2022, https://www.mom.gov.sg/passes-and-permits, https://en.wikipedia.org/wiki/National_Registration_Identity_Card

### Unique Entity Number (UEN) — `SG_UEN`

Issued by: ACRA and other UEN issuance agencies · Holders: businesses, companies and other entities · Check digit: weighted mod 11 letter · Confidence: moderate

**Format:** three shapes:
- Business (ROB, registered before 2009): 8 digits + check letter, e.g. `53012345B`.
- Local company (ROC): `YYYY` registration year + 5-digit serial + check letter, e.g. `197401143C`.
- Other entities (from 2009): `T`/`S`/`R` (20xx/19xx/18xx) + `YY` + 2-letter entity type (e.g. `LL` LLP, `LP` limited partnership, `FC` foreign company) + 4-digit serial + check character, e.g. `T08LL0001K` (example computed with the rule below, not a real registration).

**Check digit:**
- ROB: weights 10, 4, 9, 3, 8, 2, 7, 1; sum mod 11 indexes `XMKECAWLJDB`.
- ROC: weights 10, 8, 6, 4, 9, 7, 5, 3, 1; sum mod 11 indexes `ZKCMDNERGWH`. For `197401143`: sum 167, 167 mod 11 = 2 → `C`.
- Other: map characters through `ABCDEFGHJKLMNPQRSTUVWX0123456789` (A = 0), weights 4, 3, 5, 3, 10, 2, 2, 5, 7; (sum − 5) mod 11 indexes the same alphabet.

**What the library extracts:** category, serial, registration year, entity type.

**Caveats:** ACRA does not publish these algorithms; they were reverse-engineered and checked against published UENs. Future registration years and unknown entity-type codes are rejected.

Sources: https://sso.agc.gov.sg/Act/UENA2008, https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx, https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf

### IRAS Tax Reference Number (ASGD) — `SG_ASGD`

Issued by: Inland Revenue Authority of Singapore (IRAS) · Holders: individuals or entities without an NRIC/FIN or UEN · Check digit: one letter, algorithm not published · Confidence: moderate

**Format:** 9 characters, `A NNNNNNN C`: the fixed prefix `A`, 7 digits and a check letter. Example: `A1234567B` (synthetic).

| Part | Meaning |
|---|---|
| `A` | Fixed prefix |
| `NNNNNNN` | Serial |
| `C` | Check letter |

**Check digit:** The sheet calls it a "check alphabet" but doesn't give the rule, so it is not verified.

**What the library extracts:** serial, check letter.

**Caveats:** Shape only, from the OECD sheet; no published numbers were found to check it against. The other IRAS identifier on the sheet, the ITR (`NNNNNNNNNC` or 10 digits), is not modelled: without its check rule it can't be told apart from other numbers.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf

### Foreign Company Tax Reference Number — `SG_FOREIGN_COMPANY`

Issued by: IRAS · Holders: foreign companies · Check digit: one letter, algorithm not published · Confidence: moderate

**Format:** 10 characters, `F000NNNNNC` or `FDDDNNNNNC`, where `D` is a space. Example: `F00012345C` (synthetic).

| Part | Meaning |
|---|---|
| `F` | Fixed prefix |
| `000` / three spaces | Fixed filler |
| `NNNNN` | Serial |
| `C` | Check letter |

**Check digit:** Not published, so not verified.

**What the library extracts:** serial, check letter.

**Caveats:** The library treats the spaced form as the same number and normalises `F   12345C` to `F00012345C`; the sheet doesn't say whether the two forms are interchangeable. Shape only; no published numbers were found to check it against.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf

## Slovenia (SI)

### Personal Number (EMŠO) — `SI_EMSO`

Issued by: Ministry of the Interior (Central Population Register) · Holders: citizens and registered foreigners · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `DD MM YYY RR BBB K`, the former-Yugoslav JMBG. Example: `0101990 50 000 3`.

| Part | Meaning |
|---|---|
| `DDMMYYY` | Date of birth (year without its first digit) |
| `RR` | Register code; Slovenia uses 50–59 (only 50 until a 2024 amendment); pre-1991 numbers from other republics remain valid |
| `BBB` | Serial: 000–499 male, 500–999 female |
| `K` | Check digit |

**Check digit:** as for the Serbian JMBG: weights 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2; m = 11 − (sum mod 11); m = 11 → 0. Under the Slovenian decree (Uradni list RS 8/1999, art. 4), a remainder of 1 (m = 10) has no valid check digit and the serial is skipped, so the library rejects such numbers. For `010199050000`: sum 85, 85 mod 11 = 8, K = 3.

**What the library extracts:** date of birth, age, gender, region, register area, serial.

Sources: https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/1999-01-0345, https://www.gov.si/teme/registri-in-evidence-prebivalstva/, https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number

### Tax Number / VAT ID (davčna številka) — `SI_VAT`

Issued by: Financial Administration (FURS) · Holders: individuals and legal entities · Check digit: weighted mod 11 · Confidence: high

**Format:** 8 digits; the first seven are random (first digit 1–9), the eighth is the check digit. The VAT ID is the same number with an `SI` prefix, which the library strips. Example: `12345679`.

**Check digit:** multiply the first seven digits by 8, 7, 6, 5, 4, 3, 2 and sum. K = 11 − (sum mod 11); K = 10 becomes 0; K = 11 (remainder 0) is never issued. For `1234567`: sum 112, 112 mod 11 = 2, K = 9.

**What the library extracts:** nothing beyond validity.

**Caveats:** the library differs from nationid on three remainders; its mapping is confirmed by real VAT numbers in the EU VIES test set. Weights were not re-confirmed from an official FURS page in this pass.

Sources: https://www.fu.gov.si/davki_in_druge_dajatve/poslovanje_z_nami/vpis_v_davcni_register_in_davcna_stevilka/, https://ec.europa.eu/taxation_customs/vies/

## Slovakia (SK)

### Birth Number (rodné číslo) — `SK_RC`

Issued by: Ministry of Interior · Holders: citizens and registered foreigners · Check digit: whole number divisible by 11 (from 1954) · Confidence: moderate

**Format:** `YYMMDD/SSS` (9 digits, births before 1954) or `YYMMDD/SSSC` (10 digits, from 1954). Example: `710319/2745`.

| Part | Meaning |
|---|---|
| `YY` | Birth year (century inferred from length and value) |
| `MM` | Month; +50 for women; +20 (men) / +70 (women) overflow series |
| `DD` | Day of birth |
| `SSS` | Serial |
| `C` | Check digit (10-digit numbers only) |

**Check digit:** the full 10-digit number must be divisible by 11. Equivalently, C = (first nine digits as a number) mod 11, with remainder 10 written as 0 — a form issued until 1985. For `7103192745`: 7103192745 mod 11 = 0.

**What the library extracts:** date of birth, age, gender (shared parser with Czechia).

**Caveats:** the +20/+70 overflow series is set out in Czech law (53/2004 Sb.); no Slovak text confirming Slovakia uses it was found. The pre-1985 remainder-10 numbers are accepted only for birth years 1954–1985.

Sources: https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1995/301/, https://www.minv.sk/?rodne-cislo, https://sk.wikipedia.org/wiki/Rodn%C3%A9_%C4%8D%C3%ADslo

### VAT Number (IČ DPH) — `SK_VAT`

Issued by: Financial Administration (Finančná správa) · Holders: VAT-registered businesses · Check digit: divisible by 11 · Confidence: high

**Format:** `SK` + 10 digits; first digit 1–9, third digit 2, 3, 4, 7, 8 or 9. Example: `SK2021234567`. A bare 10-digit input gets `SK` added. The digits are usually the same as the holder's DIČ.

**Check digit:** the 10-digit number must be divisible by 11. For `2021234567`: 2021234567 mod 11 = 0.

**What the library extracts:** nothing beyond validity.

**Caveats:** no official statement of the check rule or the third-digit rule was found; secondary sources state the divisibility rule.

Sources: https://www.financnasprava.sk/, https://ec.europa.eu/taxation_customs/vies/

## San Marino (SM)

### Social Security Number (Codice ISS) — `SM_SSI`

Issued by: Istituto per la Sicurezza Sociale · Holders: all individuals · Check digit: none known · Confidence: low

**Format:** 9 digits, assigned in sequence. Example: `123456789`. The number carries no information about the holder. It also serves as the individual's TIN and is printed on the identity card and health card.

**Check digit:** none; the library checks only length and digits.

**What the library extracts:** nothing beyond validity.

**Caveats:** the OECD sheet shows the format as `999999999` ("more than one digit") but notes that leading zeros may be omitted, so shorter numbers occur in practice. The library accepts 2–8 digit input (not all zeros) and left-pads it with zeros, so `12345678` normalizes to `012345678`.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/san-marino-tin.pdf, https://www.iss.sm/

### Economic Operator Code (COE) — `SM_COE`

Issued by: Office of Industry, Handicraft and Trade, or the Labour Office · Holders: legal entities · Check digit: none known · Confidence: low

**Format:** `SM` + 5 digits, assigned in sequence. Example: `SM12345`.

**Check digit:** none; the library checks only the pattern.

**What the library extracts:** the five digits (as `serial`).

**Caveats:** leading zeros may be dropped in practice (the OECD sheet states this on the individuals' row; python-stdnum's COE docs say the same for the COE). The library accepts `SM` + 1–4 digits (not all zeros) and left-pads them to five, so `SM123` normalizes to `SM00123`.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/san-marino-tin.pdf

## Senegal (SN)

### ECOWAS Biometric ID Card Number — `SN_CNI`

Issued by: Direction de l'Automatisation des Fichiers (Ministry of Interior) · Holders: citizens · Check digit: unpublished · Confidence: moderate

**Format:** 17 digits, `S RR YYYYMMDD NNNNN K` (Décret 2016-1536). Example: `1 01 19900101 12345 6`.

| Part | Meaning |
|---|---|
| `S` | Sex: 1 male, 2 female |
| `RR` | Region code (no table published) |
| `YYYYMMDD` | Date of birth |
| `NNNNN` | Computer-generated serial |
| `K` | Control digit computed by the system |

**Check digit:** the decree mentions a final control digit but does not publish its algorithm; the library does not verify it and checks the shape and birth date.

**What the library extracts:** date of birth, age, gender, region code, serial, raw check digit.

**Caveats:** structure taken from the decree text; not cross-checked against real cards. The search confirmed the 17-digit length and the sex digit only.

Sources: https://www.icnl.org/wp-content/uploads/Senegal_biometric.pdf

### National Identification Number (NIN) — `SN_NIN`

Issued by: Ministry of Interior · Holders: citizens · Check digit: none known · Confidence: moderate

**Format:** 13 characters, `S CCC YYYY NNNNN` (Décret 2005-787, art. 1). Example: `1 G01 1985 00654`.

| Part | Meaning |
|---|---|
| `S` | Sex: 1 male, 2 female |
| `CCC` | Civil-registry centre that recorded the birth; since July 2012 a letter + 2 digits, before that 3 digits |
| `YYYY` | Year the birth was registered (usually, not always, the birth year) |
| `NNNNN` | Registration number of the birth act |

**Check digit:** none; the library checks the pattern and that the year is not in the future.

**What the library extracts:** gender, registry-centre code (as `region`), registration year, serial.

**Caveats:** the decree allows an optional, undefined "indice de différenciation" after the 13 characters; only the 13-character form is accepted.

Sources: https://www.osiris.sn/Decret-no-2005-787-du-6-septembre.html, https://www.osiris.sn/le-nin-de-la-carte-d-identite-numerisee-devient-alphanumerique.html

### Business and Association Identification Number (NINEA) — `SN_NINEA`

Issued by: ANSD / DGID · Holders: companies, associations and self-employed people · Check digit: none applied · Confidence: low

**Format:** 7-digit base (9 digits in newer notices), optionally followed by the 3-character COFI. Example: `3067221 2G2`.

| Part | Meaning |
|---|---|
| base | NINEA number |
| COFI 1st char | Tax regime: 0 not VAT-liable, 1 CGU, 2 VAT-liable |
| COFI 2nd char | Tax-centre letter |
| COFI 3rd char | Legal-form digit |

**Check digit:** a weighted check (weights 1, 2, 1, … mod 10) is described by python-stdnum and holds for some published numbers but fails others, and no official source states it; the library does not apply it and checks only the pattern.

**What the library extracts:** base number, COFI, tax regime, tax centre, legal form.

Sources: https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.sn.ninea, https://nkac-audit.com/comprendre-le-ninea-votre-guide-de-lecture-simplifie/, https://www.vie-publique.sn/docs/fa3d004b-8b0b-4d3c-bc09-7a50442da9e2/JO-7892-du-12-mars-2026.pdf

## Somalia (SO)

### National Identification Number — `SO_NIN`

Issued by: National Identification and Registration Authority (NIRA, Law No. 009 of 2023) · Holders: registered individuals · Check digit: none known · Confidence: low

**Format:** 11 digits, given after biometric capture (Somali: *Tirsi Aqoonsi*). Example: `12345678901`. No internal structure is published.

**Check digit:** none published; the library checks only length and digits.

**What the library extracts:** nothing beyond validity.

**Caveats:** the 11-digit Business Identification Number from the Ministry of Commerce and Industry has the same shape, so the two cannot be told apart.

Sources: https://www.id4africa.com/2025/files/PS1-S1-4-Somalia-FINAL.pdf, https://lookuptax.com/validate/somalia/bin, https://en.wikipedia.org/wiki/National_identification_number

## Suriname (SR)

### Identity Number — `SR_ID`

Issued by: Centraal Bureau voor Burgerzaken (CBB) · Holders: citizens and registered residents · Check digit: none known · Confidence: moderate

**Format:** 8 characters, two letters + six digits (Id-kaartenwet 2018, S.B. 2019 no. 16). Example: `AB123456`. It is the holder's unique administrative number on the ID card, not the card number.

**Check digit:** none published; the library checks only the pattern.

**What the library extracts:** the letter prefix and the six digits (as `serial`).

Sources: https://www.dna.sr/media/kiwf1wtw/sb_2019___16.pdf, https://gov.sr/thema/cbb/

### Tax Identification Number (FIN) — `SR_FIN`

Issued by: Belastingdienst Suriname · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 8 or 10 digits. Example: `1234567890`. The 2020 law (S.B. 2020 no. 17) defined an 8-digit number containing no information about the taxpayer; S.B. 2024 no. 74 removed the digit count because the Multi Tax System uses 10-digit numbers.

**Check digit:** none published; the library checks only length and digits.

**What the library extracts:** nothing beyond validity.

**Caveats:** the 10-digit form is not described in the law; a published VAT certificate showing a 10-digit FIN (`2000002293`) supports it.

Sources: https://www.dna.sr/media/v0hlyfgl/sb_2020___17.pdf, https://www.sris.sr/wp-content/uploads/2024/07/S.B.-2024-no.-74-WET-houdende-wijziging-van-regels-ter-toekenning-van-fiscaal-identificatienummers.pdf, https://www.assuria.sr/media/d2mpzdea/btw-certificaat-assuria-schadeverzekering-n-v.pdf

## El Salvador (SV)

### Unique Identity Document (DUI) — `SV_DUI`

Issued by: Registro Nacional de las Personas Naturales (RNPN) · Holders: citizens aged 18 and over · Check digit: weighted mod 10 · Confidence: moderate

**Format:** 9 digits, `NNNNNNNN-V`. Example: `12345678-4`. Since 2021 the DUI also serves as a natural person's NIT.

**Check digit:** multiply the eight digits by 9, 8, 7, 6, 5, 4, 3, 2 and sum. V = (10 − sum mod 10) mod 10. For `12345678`: sum 156, V = (10 − 6) = 4.

**What the library extracts:** the eight-digit number (as `serial`).

**Caveats:** not re-verified online in this pass; no official RNPN description of the algorithm was found. The all-zero placeholder is rejected.

Sources: https://www.rnpn.gob.sv/, https://docs.v3.localpayment.com/api-reference-guide/document-validations/el-salvador

### Tax Identification Number (NIT) — `SV_NIT`

Issued by: Ministerio de Hacienda · Holders: individuals and entities · Check digit: mod 11 (two schemes) · Confidence: moderate

**Format:** 14 digits, `MMMM-DDMMYY-CCC-V`. Example: `0614-150590-101-5`.

| Part | Meaning |
|---|---|
| `MMMM` | Municipality: department 01–14 + municipality; `9xxx` for foreigners |
| `DDMMYY` | Date of birth (people) or incorporation (companies) |
| `CCC` | Correlative number |
| `V` | Check digit |

**Check digit:** Hacienda keeps the algorithm private; two schemes fit every published NIT:
- `CCC` ≤ 100: weights 14, 13, …, 2 left to right; V = (sum mod 11) mod 10. For UES `0614-110121-001`: sum 179, 179 mod 11 = 3.
- `CCC` > 100: weights 2–7 cycling from the right; V = ((11 − sum mod 11) mod 11) mod 10. For `0614-150590-101`: sum 182, 182 mod 11 = 6, V = 5.

**What the library extracts:** municipality code, department name (or `citizenship: foreigner`), date, correlative (as `serial`).

**Caveats:** both schemes are inferred from published numbers, not from an official specification. nationid uses only the first scheme with a different final step, which rejects most real NITs. Not re-verified online in this pass.

Sources: https://transparencia.mh.gob.sv/downloads/pdf/PMHDC10917.pdf, https://www.mh.gob.sv/wp-content/uploads/2020/11/PMHDC9225.pdf, https://arthurdejong.org/python-stdnum/doc/stdnum.sv.nit

### Passport Number — `SV_PASAPORTE`

Issued by: Dirección General de Migración y Extranjería · Holders: citizens · Check digit: none known · Confidence: low

**Format:** optional letter + 7–9 digits. Example: `123456789`.

**Check digit:** none known; the library checks only length and pattern.

**What the library extracts:** nothing beyond validity.

Sources: https://www.migracion.gob.sv/, https://en.wikipedia.org/wiki/Salvadoran_passport

## Eswatini (SZ)

### Eswatini Personal Identification Number — `SZ_PIN`

Issued by: Ministry of Home Affairs (civil registration) · Holders: citizens and registered foreign residents · Check digit: Luhn (reverse-engineered) · Confidence: low

**Format:** 13 digits, `YYMMDD X C SSSS K`. Example: `850423 6100122`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth; century not encoded |
| `X` | Sex: 1 seen for women, 6 for men |
| `C` | 0 for foreign nationals and 1 for Swazis in the samples, sometimes 2 or 3; probably a citizenship/region code |
| `SSSS` | Serial |
| `K` | Check digit |

The Identification Order, 1998 (s.5(2)) says the number is built from figures and encodes sex, date of birth, citizenship and, for Swazis, region, chief and indvuna, plus a serial, index and control number. The regulation that fixes the positions is not published online. The layout above was inferred from 18 PINs quoted in EswatiniLII court judgments.

**Check digit:** Luhn over the first 12 digits, as in South Africa's ID number. Starting from the 12th digit and moving left, double every second digit (the 12th, 10th, ...), subtract 9 from any result above 9, and add everything. The check digit is `(10 − sum mod 10) mod 10`. For `850423610012` the sum is 38, so the check digit is 2. 17 of the 18 samples pass.

**What the library extracts:** date of birth (latest past century), age, gender (only for 1 and 6), serial; the raw sex digit and 8th digit in `extra`.

**Caveats:** Positions and check digit are reverse-engineered from court records, not from an official specification. Digits other than 1/6 in position 7 are left unmapped. The meaning of the 8th digit is unconfirmed. Not re-verified online beyond the Order: no public description of the layout was found.

Sources: https://eswatinilii.org/akn/sz/act/order-in-council/1998/4/eng@1998-12-01, https://eswatinilii.org/akn/sz/judgment/szhc/2020/98/eng@2020-05-26, https://eswatinilii.org/akn/sz/judgment/szhc/2021/134/eng@2021-08-20, https://eswatinilii.org/akn/sz/judgment/szhc/2021/34/eng@2021-03-30

### Eswatini Revenue Service Taxpayer Identification Number — `SZ_TIN`

Issued by: Eswatini Revenue Service (ERS) · Holders: individuals and entities · Check digit: none known · Confidence: low

**Format:** 9 digits from 100000000 to 199999999 (always starting with 1). Example: `123456789`. The same number serves as the VAT number.

**Check digit:** none known. The library checks only length and the leading 1.

**What the library extracts:** the number as serial.

**Caveats:** Based on one secondary source (the 1xxxxxxxx range that ERS's own VAT check accepts). Not re-verified online.

Sources: https://lookuptax.com/validate/eswatini/tin

## Thailand (TH)

### Thai Population Identification Code — `TH_PIN`

Issued by: Department of Provincial Administration (DOPA), Ministry of Interior · Holders: everyone in a Thai house register, including registered foreigners and stateless persons · Check digit: weighted mod 11 · Confidence: high

**Format:** 13 digits, `C PPDD BBBBB NN X`, printed `1-2345-67890-12-3`. Example: `1-1017-00000-00-1`.

| Part | Meaning |
|---|---|
| `C` | Registration category: 1 Thai born from 1984, registered on time; 2 same, registered late; 3 in a house register before 31 May 1984; 4 moved into a register before 1984 without a number; 5 Thai added later; 6 foreigner resident temporarily or entered illegally; 7 child of a category-6 person born in Thailand; 8 foreigner registered/naturalised from 1984; 0 persons without registration status or Thai nationality. 9 is not issued. |
| `PP` | Province of the registration office (same codes as ISO 3166-2:TH) |
| `DD` | District office; municipal offices count down from 99 (Pattaya is 20-96) |
| `BBBBB NN` | Register book/group and sequence |
| `X` | Check digit |

**Check digit:** multiply digits 1–12 by 13, 12, ..., 2 and add. Check digit = `(11 − sum mod 11) mod 10`. For `110170000000`: 13·1 + 12·1 + 11·0 + 10·1 + 9·7 = 98 (the rest are zeros); 98 mod 11 = 10; 11 − 10 = 1, so the check digit is 1.

**What the library extracts:** category and its meaning, citizenship where the category implies it, province code and name, registration office (`PPDD`), serial.

**Caveats:** The check-digit formula is widely used and real numbers pass it, but DOPA does not publish it. The library validates the province but not the district, because municipal district numbers fall outside per-province maxima. Category 0 numbers carry no office code, so the province is not checked for them. Categories 3, 4 and 8 can be either Thai or foreign, so no citizenship is reported.

Sources: https://www.bora.dopa.go.th/, https://th.wikipedia.org/wiki/เลขประจำตัวประชาชนไทย, https://en.wikipedia.org/wiki/ISO_3166-2:TH, https://en.wikipedia.org/wiki/Thai_identity_card

## Tajikistan (TJ)

### Tajik Taxpayer Identification Number — `TJ_INN`

Issued by: Tax Committee under the Government of Tajikistan · Holders: individuals and legal entities · Check digit: weighted mod 11 (reverse-engineered) · Confidence: low

**Format:** 9 digits, the last a check digit. Example: `012345673`. Known locally as РМА / ИНН.

**Check digit:** multiply digits 1–8 by 10, 7, 5, 10, 4, 3, 8, 6 and add; take the sum mod 11. That remainder is the check digit, except a remainder of 10 gives 5. For `01234567`: 0 + 7 + 10 + 30 + 16 + 15 + 48 + 42 = 168; 168 mod 11 = 3, so the number is `012345673`. The rule matched 239 of 240 suppliers in the official e-procurement register; the one miss started with 9.

**What the library extracts:** nothing beyond validity.

**Caveats:** The rule is reverse-engineered; the Tax Committee does not publish it. Numbers starting with 9 (possibly foreign entities) may follow another rule. One secondary source says digits 1–2 are the tax office and digit 3 a status digit; that is unverified, so nothing is extracted. Online sources found only confirm the 9-digit length. The 10-digit unified entity number (EIN, РЯМ) is a different identifier and is not covered.

Sources: https://eprocurement.gov.tj/ru/register/supplierreg, https://eprocurement.gov.tj/en/register/supplierreg/show/125808, https://www.opensanctions.org/datasets/tj_companies

## Tunisia (TN)

### Tunisian National Identity Card Number — `TN_CIN`

Issued by: Ministry of the Interior · Holders: Tunisian citizens · Check digit: none known · Confidence: moderate

**Format:** 8 digits. Example: `01234567`.

Numbers are issued sequentially from blocks allocated to each region. The World Bank's 2020 diagnostic says the number has no check digit; the control digits printed on the card belong to the barcode. The region blocks are not published.

**Check digit:** none known. The library checks only length and pattern.

**What the library extracts:** the number as serial.

**Caveats:** Not re-verified online beyond the World Bank report.

Sources: https://documents1.worldbank.org/curated/en/368931596533672339/text/Diagnostic-of-ID-Systems-in-Tunisia.txt

### Tunisian Tax Identification Number — `TN_MF`

Issued by: Direction Générale des Impôts (DGI) · Holders: individuals and entities with tax obligations · Check digit: weighted mod 23 letter · Confidence: moderate

**Format:** `NNNNNNN/K/T/C/EEE` (13 characters compact), or the short form `NNNNNNNK`. Example: `1282182/W/A/M/000`. Older notation: `345 769 JAM 000`.

| Part | Meaning |
|---|---|
| `NNNNNNN` | Identifier, 7 digits (often printed without leading zeros) |
| `K` | Check letter, from the 23 letters A–Z without I, O, U |
| `T` | VAT code: A, P, B, D or N |
| `C` | Category code: M, P, C, N, or E (secondary establishment) |
| `EEE` | Establishment number: 000 for the main establishment |

**Check digit:** multiply the 7 digits by 7, 6, 5, 4, 3, 2, 1, add, take mod 23, and use the result as an index (from 0) into `ABCDEFGHJKLMNPQRSTVWXYZ`. For `1282182`: 7 + 12 + 40 + 8 + 3 + 16 + 2 = 88; 88 mod 23 = 19 → `W`.

**What the library extracts:** identifier (padded to 7 digits), check letter, and for the long form the VAT code, category and establishment number. An establishment other than 000 requires category E.

**Caveats:** The DGI publishes only the allowed letters, not the formula. The formula comes from an Odoo localisation module and matched five independent real numbers. Sources disagree on the code lists: the Odoo module lists only M, C, P, N as categories. The meanings of the VAT and category letters are not sourced officially, so they are returned raw.

Sources: https://apps.odoo.com/apps/modules/17.0/tn_vat_validation, https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.tn.mf, https://www.jurist.org/news/wp-content/uploads/sites/4/2022/07/077Journal-annonces2022.pdf

## Turkey (TR)

### Turkish Identification Number — `TR_TCKN`

Issued by: General Directorate of Population and Citizenship Affairs (NVİ) · Holders: Turkish citizens; foreigners get a 99-prefixed Yabancı Kimlik Numarası · Check digit: two digits (mod 10) · Confidence: high

**Format:** 11 digits, `D1…D9 C10 C11`, D1 never 0. Example: `10000000146`.

| Part | Meaning |
|---|---|
| `D1…D9` | Serial; no date, sex or place is encoded |
| `C10` | First check digit |
| `C11` | Second check digit |

Numbers starting with 99 are foreigner identity numbers assigned by NVİ / the Migration Administration; they use the same check digits.

**Check digit:** C10 = `(7 × (D1+D3+D5+D7+D9) − (D2+D4+D6+D8)) mod 10`, taken as a non-negative remainder. C11 = `(D1 + … + D10) mod 10`. For `100000001`: odd-position sum 2, even-position sum 0, C10 = 14 mod 10 = 4; sum of D1–D10 = 6, C11 = 6.

**What the library extracts:** whether it is a citizen or foreigner (99-prefixed) number, reported as `citizenship: "foreigner"` for 99.

**Caveats:** Some implementations compute C10 with a signed `%` and reject valid numbers where the even sum exceeds 7 × the odd sum (e.g. `19090909018`); the library uses a true modulo.

Sources: https://www.nvi.gov.tr/, https://www.nvi.gov.tr/kurumlar/nvi.gov.tr/mevzuat/nufusmevzuat/talimat/yabancilarakimliknumarasiverilmesiveadreskayitlarinintutulmasi.pdf, https://tr.wikipedia.org/wiki/T.C._Kimlik_Numarası

## Trinidad and Tobago (TT)

### Trinidad and Tobago Board of Inland Revenue Number — `TT_BIR`

Issued by: Board of Inland Revenue (Inland Revenue Division) · Holders: individuals, companies, partnerships and trusts · Check digit: none known · Confidence: moderate

**Format:** 10 digits, system-generated and never reused. Example: `1234567890`.

Under the Income Tax Act (Chap. 75:01, s. 76/76A) the BIR file number is the taxpayer number. According to the BIR's submission to the OECD, it has no check digit and no digit marking the taxpayer type. The IRD's 2026 CRS registration guide confirms it is entered as 10 digits without symbols.

**Check digit:** none known. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape match.

**Caveats:** The National Insurance number is a separate identifier and is not covered.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/trinidad-and-tobago-tin.pdf, https://www.ird.gov.tt/, https://www.ird.gov.tt/Media/Default/CRS/CRS-FI-Registration-Guide--2026.pdf

## Taiwan (TW)

### Taiwan National Identification Number — `TW_NIC`

Issued by: Ministry of the Interior (household registration offices) · Holders: citizens with household registration · Check digit: weighted mod 10 · Confidence: high

**Format:** 10 characters, `L G SSSSSSS C`. Example: `A123456789`.

| Part | Meaning |
|---|---|
| `L` | City/county of first household registration (A Taipei City, B Taichung City, ... Z Lienchiang County; some counties have since merged) |
| `G` | Sex: 1 male, 2 female |
| `SSSSSSS` | Serial |
| `C` | Check digit |

**Check digit:** convert the letter to two digits: A=10, B=11, ... H=17, J=18, ... V=29, with X=30, Y=31, W=32, Z=33, I=34, O=35 out of sequence. Multiply the 11 digits (two letter digits, then the nine digits) by 1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1 and add; the sum must be divisible by 10. For `A123456789`: 1·1 + 0·9 + 1·8 + 2·7 + 3·6 + 4·5 + 5·4 + 6·3 + 7·2 + 8·1 + 9·1 = 130, valid.

**What the library extracts:** gender, citizenship (citizen), region letter and name, serial.

Sources: https://schema.gov.tw/lists/167, https://zh.wikipedia.org/wiki/中華民國國民身分證

### Taiwan Resident Certificate (UI) Number — `TW_ARC`

Issued by: National Immigration Agency · Holders: foreigners, stateless persons, mainland/Hong Kong/Macao residents and nationals without household registration · Check digit: weighted mod 10 (same as the NIC) · Confidence: moderate

**Format:** 10 characters. Two formats are in use. Example: `A800000014` (new), whose old-format equivalent is `AC0****014`.

| Part | Meaning |
|---|---|
| `L` | Region letter, as for the NIC (where the person applied) |
| New format (from 2021-01-02): `G` | 8 male, 9 female |
| New format: `N` | Category: 0–6 foreigner or stateless, 7 national without household registration, 8 Hong Kong/Macao resident, 9 mainland resident |
| Old format (valid until 2030-12-31): 2nd letter | A/B male/female (mainland, HK/Macao, nationals without registration); C/D male/female (foreigners) |
| Rest | Serial and check digit |

**Check digit:** as for the NIC. In the old format the second letter contributes only the units digit of its letter value (A→0, B→1, C→2, D→3). For `A800000014`: 1 + 0 + 8·8 + 1·1 + 4·1 = 70, valid.

**What the library extracts:** gender, citizenship/kind (foreigner, HK/Macao resident, mainland resident, national without registration), region, serial, format (legacy or 2021).

**Caveats:** The Immigration Agency confirms the 1-letter + 9-digit new format, the 8/9 gender digit and the old 2-letter format; the meaning of the new third digit and of the old A–D letters was not found in official pages and comes from secondary sources.

Sources: https://www.immigration.gov.tw/5385/7445/238440/238446/247454/, https://www.immigration.gov.tw/5385/12162/238449/382804/, https://zh.wikipedia.org/wiki/中華民國居留證, https://www.cna.com.tw/news/asoc/202012160106.aspx

### Taiwan Business Administration Number — `TW_UBN`

Issued by: Ministry of Finance / Ministry of Economic Affairs · Holders: businesses and other organisations · Check digit: weighted digit-sum mod 5 · Confidence: high

**Format:** 8 digits. Example: `12345601`.

**Check digit:** multiply the digits by 1, 2, 1, 2, 1, 2, 4, 1; add the digits of each product (12 counts as 1+2). The total must be divisible by 5 (by 10 before the 2023 change; old numbers satisfy both). If the 7th digit is 7, its product 28 may count as 10 or 1, so `total + 1` divisible by 5 also passes. For `12345601`: products 1, 4, 3, 8, 5, 12, 0, 1 → 1+4+3+8+5+3+0+1 = 25, valid.

**What the library extracts:** nothing beyond validity.

**Caveats:** Since the mod-5 relaxation, two final digits pass for every body, so the check does not identify a unique last digit.

Sources: https://www.fia.gov.tw/singlehtml/3?cntId=c4d9cff38c8642ef8872774ee9987283, https://www.fia.gov.tw/singlehtml/3?cntId=4246ca18578e45deaa884285d6863d41

## Tanzania (TZ)

### Tanzanian National Identification Number — `TZ_NIN`

Issued by: National Identification Authority (NIDA) · Holders: citizens and residents aged 18 and over · Check digit: 7-3-1 mod 10 (reverse-engineered) · Confidence: low

**Format:** 20 digits, `YYYYMMDD-AAAAA-SSSSS-XK`. Example: `19850423-12345-00001-22`.

| Part | Meaning |
|---|---|
| `YYYYMMDD` | Date of birth, full year |
| `AAAAA` | 5-digit code, probably the registration area (unconfirmed) |
| `SSSSS` | Serial |
| `X` | 1 or 2 in all samples; possibly sex (unconfirmed) |
| `K` | Check digit |

**Check digit:** multiply the first 19 digits by the repeating weights 7, 3, 1 and take the sum mod 10 (the ICAO 9303 MRZ check). For `1985042312345000012` the sum is 182, so the check digit is 2.

**What the library extracts:** date of birth, age, serial; the area code and 19th digit raw in `extra`.

**Caveats:** NIDA does not publish the structure. The 20-digit length is confirmed by NIDA guides and KYC documentation; the layout and the check were reverse-engineered from 12 NINs in TanzLII judgments (all start with a real birth date, 11 of 12 pass the check). No online source found confirms the field layout.

Sources: https://tanzlii.org/, https://taxdo.com/resources/faq/post/verify-tanzania-tin-nida-nin-tax-id.md

## Ukraine (UA)

### Ukrainian Individual Tax Number — `UA_RNOKPP`

Issued by: State Tax Service (DPS) · Holders: individuals registered as taxpayers · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 10 digits, `XXXXX NNNN K`. Example: `2922012341`.

| Part | Meaning |
|---|---|
| `XXXXX` | Date of birth as a day count: 00001 = 1900-01-01 |
| `NNNN` | Serial; its last digit (9th of the number) is odd for men, even for women |
| `K` | Check digit |

**Check digit:** multiply digits 1–9 by −1, 5, 7, 9, 4, 6, 10, 5, 7 and add; take the sum mod 11 (non-negative), then mod 10. For `292201234`: sum 144; 144 mod 11 = 1, so the check digit is 1. Day 29220 is 1980-01-01; the 9th digit 4 means female.

**What the library extracts:** date of birth, age, gender, serial.

**Caveats:** The DPS says only it can verify a number's correctness; the formula is not officially published but is widely used. The register holds the "sequence number of the birth date", so the decoded date is what the register holds. Future dates are rejected.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/ukraine-tin.pdf, https://tax.gov.ua, https://en.wikipedia.org/wiki/National_identification_number#Ukraine, https://news.dtkt.ua/taxation/common/108715-iaki-organi-maiut-pravo-pereviriati-ta-pidtverdzuvati-dostovirnist-rnokpp

### Ukrainian Legal Entity Code — `UA_EDRPOU`

Issued by: State Statistics Service / Unified State Register (USREOU) · Holders: legal entities and separate subdivisions · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 8 digits. Example: `32855961`.

**Check digit:** use weights 1, 2, 3, 4, 5, 6, 7 over digits 1–7, or 7, 1, 2, 3, 4, 5, 6 when 30 000 000 ≤ code < 60 000 000 (first digit 3, 4 or 5). Take the sum mod 11. If that is 10, repeat with every weight increased by 2; if the result is 10 again, the check digit is 0. For `3285596` (shifted weights): 21 + 2 + 16 + 15 + 20 + 45 + 36 = 155; 155 mod 11 = 1.

**What the library extracts:** nothing beyond validity.

**Caveats:** The algorithm is not officially published; it comes from community implementations. The lower bound is inclusive, matching implementations that select by first digit 3–5 (python-stdnum); it only matters for `30000000` itself, which is invalid either way (its check digit would be 5). The library uses plain weights for codes starting with 6, unlike idnumbers, which shifts 3–6.

Sources: https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/ukraine-tin.pdf, https://uk.wikipedia.org/wiki/%D0%9A%D0%BE%D0%B4_%D0%84%D0%94%D0%A0%D0%9F%D0%9E%D0%A3, https://1cinfo.com.ua/Article/Detail/Proverka_koda_po_EDRPOU/

### Ukrainian Demographic Register Record Number — `UA_UNZR`

Issued by: State Migration Service (Unified State Demographic Register, ЄДДР) · Holders: people issued a biometric ID card or biometric passport · Check digit: 7-3-1 mod 10 · Confidence: moderate

**Format:** 13 digits, `YYYYMMDD-NNNNC`. Example: `19800101-00121`. Printed on the front of the ID card, lower right, above the passport number. It never changes, even after a name change.

| Part | Meaning |
|---|---|
| `YYYYMMDD` | Date of birth |
| `NNNN` | Code 0001–9999 |
| `C` | Check digit |

**Check digit:** computed as in passport machine-readable zones (ICAO 9303): multiply the first 12 digits by 7, 3, 1 repeating and take the sum mod 10. For `198001010012` the sum is 51, so the check digit is 1.

**What the library extracts:** date of birth, age, the 4-digit code as serial.

**Caveats:** The government page states only that the MRZ method is used; the weights are the standard ICAO ones.

Sources: https://www.kmu.gov.ua/news/unikalnyi-nomer-zapysu-v-ieddr-shcho-tse-ta-de-shukaty

## Uganda (UG)

### Ugandan National Identification Number — `UG_NIN`

Issued by: National Identification and Registration Authority (NIRA) · Holders: citizens and registered non-citizens · Check digit: none known · Confidence: low

**Format:** 14 alphanumeric characters, `K G YY SSSSSSSSSS`. Example: `CF85000012345A`. Printed on the Ndaga Muntu card.

| Part | Meaning |
|---|---|
| `K` | Applicant class: C citizen, F foreigner/non-citizen |
| `G` | Gender: M or F |
| `YY` | Last two digits of the birth year |
| `SSSSSSSSSS` | 10-character NIRA serial (digits and letters) |

**Check digit:** none known. NIRA publishes no check algorithm, so the library checks only length and pattern.

**What the library extracts:** birth year (latest year not in the future), gender, citizenship (C/F), serial, raw applicant class.

**Caveats:** The layout comes from one third-party validator and matches the CM…/CF… numbers seen on cards; no official NIRA specification was found. One article calls it a "14-digit number", which conflicts with the letters seen on cards.

Sources: https://www.nira.go.ug/, https://gera-tools.pages.dev/uganda-nin-validator, https://bills.parliament.ug/attachments/Laws%20of%20Uganda%20(Acts)%20-%20THE%20REGISTRATION%20OF%20PERSONS%20ACT,%202015.pdf

## United States (US)

### United States Social Security Number — `US_SSN`

Issued by: Social Security Administration (SSA) · Holders: citizens, permanent residents and work-authorised non-citizens · Check digit: none · Confidence: high

**Format:** 9 digits, `AAA-GG-SSSS`. Example: `123-45-6789`.

| Part | Meaning |
|---|---|
| `AAA` | Area number; never 000, 666 or 900–999. Since 2011-06-25 assigned at random, so it no longer shows the state |
| `GG` | Group number; never 00 |
| `SSSS` | Serial; never 0000 |

**Check digit:** none. Validity is structural only.

**What the library extracts:** area, group, serial. Reserved ranges and the two numbers the SSA voided after mass misuse (`078-05-1120`, `219-09-9999`) are reported as `invalid_range`.

Sources: https://www.ssa.gov/employer/randomization.html, https://www.ssa.gov/employer/randomizationfaqs.html, https://www.ssa.gov/history/ssn/misused.html, https://en.wikipedia.org/wiki/Social_Security_number

### United States Individual Taxpayer Identification Number — `US_ITIN`

Issued by: Internal Revenue Service (IRS) · Holders: people who need a tax number but cannot get an SSN · Check digit: none · Confidence: high

**Format:** 9 digits, `9AA-GG-SSSS`. Example: `912-70-1234`. Starts with 9; the 4th–5th digits (group) are 50–65, 70–88, 90–92 or 94–99.

**Check digit:** none. The library checks the leading 9 and the group range.

**What the library extracts:** group, serial, and `extra.expired: true` for groups 70–88.

**Caveats:** A well-formed ITIN can still be expired: per IRS guidance (Form W-7 instructions), ITINs with middle digits 70–88 have all expired (rolling expiry 2017–2020). They stay valid shapes, since they can be renewed, and the library flags them with `extra.expired`. Other ITINs expire after three tax years without use; the library can't see that.

Sources: https://www.irs.gov/individuals/individual-taxpayer-identification-number, https://www.eitc.irs.gov/pub/irs-pdf/p4757.pdf, https://www.irs.gov/pub/irs-prior/iw7--2023.pdf

### United States Adoption Taxpayer Identification Number — `US_ATIN`

Issued by: Internal Revenue Service (IRS) · Holders: children in a pending domestic adoption who do not yet have an SSN · Check digit: none · Confidence: high

**Format:** 9 digits, `9AA-93-SSSS`. Example: `912-93-1234`. Group 93 is the one the ITIN ranges leave out.

**Check digit:** none. The library checks the leading 9 and group 93.

**What the library extracts:** serial.

Sources: https://www.irs.gov/individuals/adoption-taxpayer-identification-number, https://www.eitc.irs.gov/pub/irs-pdf/p4757.pdf

### United States Employer Identification Number — `US_EIN`

Issued by: Internal Revenue Service (IRS) · Holders: employers, businesses, trusts, estates and other entities · Check digit: none · Confidence: high

**Format:** 9 digits, `PP-SSSSSSS`. Example: `12-3456789`.

| Part | Meaning |
|---|---|
| `PP` | Prefix of the IRS campus that assigned it, or Internet (online) or SBA |
| `SSSSSSS` | Serial |

**Check digit:** none. The library checks that the prefix is on the IRS valid-prefix list; 00, 07–09, 17–19, 28–29, 49, 69–70, 78–79, 89 and 96–97 are not issued.

**What the library extracts:** prefix, serial.

Sources: https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes

### United States Passport Number — `US_PASAPORTE`

Issued by: Department of State · Holders: US nationals · Check digit: none on the printed number · Confidence: moderate

**Format:** 9 characters: one letter + 8 digits (Next Generation Passport, issued since 2021, and the passport card), or 9 digits (older books). Example: `A12345678`.

**Check digit:** none on the printed number (the MRZ adds its own ICAO check digit). The library checks only length and pattern.

**What the library extracts:** kind (legacy or next-generation).

**Caveats:** The letter + 8 digits format is described by secondary sources; the State Department page confirms the 2021 Next Generation book but not the number format.

Sources: https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html, https://en.wikipedia.org/wiki/United_States_passport

## Uruguay (UY)

### Uruguayan Identity Card Number — `UY_CI`

Issued by: Dirección Nacional de Identificación Civil (DNIC) · Holders: citizens and legal residents · Check digit: weighted mod 10 · Confidence: moderate

**Format:** 7 digits + check digit, written `1.234.567-2`. Numbers below 1,000,000 are zero-padded to 8 digits. Example: `12345672`.

**Check digit:** multiply the 7 digits by 2, 9, 8, 7, 6, 3, 4 and add. Check digit = `(10 − sum mod 10) mod 10`. For `1234567`: 2 + 18 + 24 + 28 + 30 + 18 + 28 = 148; 10 − 8 = 2.

**What the library extracts:** the 7-digit body as serial.

**Caveats:** A valid check digit does not mean the number has been issued.

Sources: https://www.gub.uy/ministerio-interior/direccion-nacional-identificacion-civil, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Uruguay-TIN.pdf, https://es.wikipedia.org/wiki/C%C3%A9dula_de_identidad_(Uruguay)

### Uruguayan Taxpayer Registry Number — `UY_RUT`

Issued by: Dirección General Impositiva (DGI) · Holders: individuals and entities with tax activity · Check digit: weighted mod 11 · Confidence: moderate

**Format:** 12 digits, `AA BBBBBB 001 D`. Example: `21-176335-001-8` (Intendencia de Montevideo).

| Part | Meaning |
|---|---|
| `AA` | Registration prefix, 01–22 |
| `BBBBBB` | Sequential number (not 000000) |
| `001` | Fixed block |
| `D` | Check digit |

**Check digit:** multiply digits 1–11 by 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 and add. c = `11 − sum mod 11`; 11 becomes 0; 10 is never issued. For `21176335001`: sum 190; 190 mod 11 = 3; 11 − 3 = 8.

**What the library extracts:** prefix, sequential number as serial.

**Caveats:** DGI declined to publish the algorithm (access-to-information request 2024-5-1-0002222), so it was cross-checked against public-sector RUTs in official documents. nationid applies the weights in reverse and maps remainder 1 to digit 1, which rejects real RUTs; the library uses left-to-right weights and treats c = 10 as unissued.

Sources: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Uruguay-TIN.pdf, https://www.gub.uy/ministerio-economia-finanzas/sites/ministerio-economia-finanzas/files/2024-04/Expediente-2024-5-1-0002222%20Francisco%20Xavier.pdf, https://www.dgi.gub.uy/

### Uruguayan Passport Number — `UY_PASAPORTE`

Issued by: Dirección Nacional de Identificación Civil (DNIC) · Holders: citizens · Check digit: none known · Confidence: low

**Format:** 1 letter + 6 digits. Example: `B123456`.

**Check digit:** none known on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape match.

**Caveats:** Not re-verified online.

Sources: https://www.gub.uy/ministerio-interior/direccion-nacional-identificacion-civil

## Uzbekistan (UZ)

### Uzbek Personal Identification Number — `UZ_PINFL`

Issued by: State Personalization Centre (registration under Cabinet of Ministers Resolution No. 177 of 12.04.2022) · Holders: citizens, foreigners and stateless persons registered in Uzbekistan · Check digit: 7-3-1 mod 10 · Confidence: high

**Format:** 14 digits in five groups, `G DDMMYY RRR NNN C`. Example: `3 121093 204 024 7`.

| Part | Meaning |
|---|---|
| `G` | Sex and century: 1/2 1800s, 3/4 1900s, 5/6 2000s; odd male, even female |
| `DDMMYY` | Date of birth |
| `RRR` | District/city code of the registering office (for foreigners, where they applied, including consulates) |
| `NNN` | Sequence among people born that day in that district |
| `C` | Check digit |

**Check digit:** multiply the first 13 digits by 7, 3, 1 repeating, add, and take mod 10. For `3121093204024` the sum is 127, so the check digit is 7 (the regulation's own worked example).

**What the library extracts:** date of birth, age, gender, district code, serial.

**Caveats:** The district classifier isn't published with the regulation, so codes are not named.

Sources: https://lex.uz/docs/5955665, https://kun.uz/en/news/2026/01/26/how-to-find-your-pinfl, https://norma.uz/novoe_v_zakonodatelstve/utverjden_poryadok_opredeleniya_i_vydachi_pinfl_v_respublike_uzbekistan

## Venezuela (VE)

### Venezuelan Identity Card Number — `VE_CEDULA`

Issued by: Servicio Administrativo de Identificación, Migración y Extranjería (SAIME) · Holders: Venezuelans (V) and foreign residents (E) · Check digit: none · Confidence: moderate

**Format:** a letter and a correlative number of 7 or 8 digits, `V-12345678` or `E-12345678`. Example: `V12345678`.

**Check digit:** none. The library checks only the prefix, length and pattern.

**What the library extracts:** citizenship (V citizen, E foreigner), number as serial.

**Caveats:** The RIF-only prefixes J and G and 9-digit numbers are rejected; idnumbers accepts them as cédulas. Not re-verified online.

Sources: http://www.saime.gob.ve/, https://en.wikipedia.org/wiki/Venezuelan_identity_card

### Venezuelan Fiscal Information Registry Number — `VE_RIF`

Issued by: SENIAT · Holders: individuals and entities · Check digit: weighted mod 11 · Confidence: moderate

**Format:** letter + 8 digits + check digit, `J-12345678-9`. Example: `J-12345678-4`.

| Part | Meaning |
|---|---|
| Letter | V Venezuelan, E foreign resident, J legal person, P passport holder (non-resident), G government body |
| 8 digits | For V/E, the holder's cédula padded to 8 digits; otherwise a registry number |
| Last digit | Check digit |

**Check digit:** start with the letter value (V 4, E 8, J 12, P 16, G 20), add the 8 digits multiplied by 3, 2, 7, 6, 5, 4, 3, 2. dv = `11 − sum mod 11`; 10 and 11 become 0. For `J12345678`: 12 + 138 = 150; 150 mod 11 = 7; 11 − 7 = 4.

**What the library extracts:** kind, citizenship for V/E, serial, check digit.

**Caveats:** Prefix C (consejo comunal) is rejected: one implementation gives it the value 24 and another 12, and no issuer source or real number settles it. SENIAT does not publish the algorithm; it was not re-verified online.

Sources: http://www.seniat.gob.ve/, https://en.wikipedia.org/wiki/National_identification_number#Venezuela

### Venezuelan Passport Number — `VE_PASAPORTE`

Issued by: SAIME · Holders: Venezuelan citizens · Check digit: none known · Confidence: low

**Format:** 8 or 9 digits. Example: `123456789`.

**Check digit:** none known on the printed number. The library checks only length and pattern.

**What the library extracts:** nothing beyond the shape match.

**Caveats:** Not re-verified online.

Sources: http://www.saime.gob.ve/, https://en.wikipedia.org/wiki/Venezuelan_passport

## Vietnam (VN)

### Vietnamese Personal Identification Number — `VN_CCCD`

Issued by: Ministry of Public Security · Holders: Vietnamese citizens, from birth · Check digit: none · Confidence: high

**Format:** 12 digits, `PPP G YY RRRRRR`. Example: `001 0 89 000123`. Same number as the personal identification number (số định danh cá nhân) on the Citizen Identity Card (CCCD, since 2016) and the Identity Card (căn cước, since July 2024).

| Part | Meaning |
|---|---|
| `PPP` | Province where the birth was registered (001–096, the 63 pre-2025 provinces), or a country code for births registered abroad |
| `G` | Century and sex: 0/1 1900s, 2/3 2000s, 4/5 2100s, ...; even male, odd female |
| `YY` | Last two digits of the birth year |
| `RRRRRR` | Random number |

**Check digit:** none.

**What the library extracts:** birth year, gender, citizenship (citizen), province code and name (from Annex I), serial.

**Caveats:** Unknown province codes are not rejected because births abroad use country codes. Birth years in the future and province 000 are rejected. Province codes refer to the 63 provinces before the 2025 mergers.

Sources: https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Circular-59-2021-TT-BCA-elaborating-to-Law-on-Citizen-Identity-Card-479508.aspx, https://lawnet.vn/en/vb/Circular-07-2016-TT-BCA-detailing-Law-on-Citizen-Identification-137-2015-ND-CP-5CCC3.html, https://baohiemxahoidientu.vn/bhxh/ma-so-can-cuoc-cong-dan.html, https://thuvienphapluat.vn/tintuc/vn/thoi-su-phap-luat/tu-van-phap-luat/42015/04-dieu-can-biet-ve-ma-so-can-cuoc-cong-dan

### Vietnamese People's Identity Card Number — `VN_CMND`

Issued by: Ministry of Public Security · Holders: citizens (old card) · Check digit: none known · Confidence: low · Deprecated

**Format:** 9 digits. Example: `012345678`. In practice the first two digits are the issuing province, but no verifiable published structure exists.

**Check digit:** none known. The library checks only length and pattern.

**What the library extracts:** citizenship (citizen).

**Caveats:** CMND cards stopped being valid on 2025-01-01 (Law on Identification 2023, Art. 46).

Sources: https://en.wikipedia.org/wiki/Vietnamese_identity_card, https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Can-cuoc-2023-so-26-2023-QH15-544793.aspx

## South Africa (ZA)

### South African Identity Number — `ZA_ID`

Issued by: Department of Home Affairs · Holders: citizens, permanent residents, refugees · Check digit: Luhn · Confidence: high

**Format:** 13 digits, `YYMMDD SSSS C A Z`. Example: `800101 5009 087`.

| Part | Meaning |
|---|---|
| `YYMMDD` | Date of birth; century not encoded |
| `SSSS` | 0000–4999 female, 5000–9999 male |
| `C` | 0 citizen, 1 permanent resident, 2 refugee |
| `A` | Historically a race marker (pre-1986); now usually 8. Not validated |
| `Z` | Luhn check digit |

**Check digit:** Luhn over the first 12 digits. From the 12th digit leftwards, double every second digit (12th, 10th, ...), subtract 9 from results above 9, and add all 12 values. Check digit = `(10 − sum mod 10) mod 10`. For `800101500908`: 8+0+0+2+0+2+5+0+0+9+0+7 = 33, so the check digit is 7.

**What the library extracts:** date of birth (latest century that puts it in the past), age, gender, citizenship, serial.

**Caveats:** The Identification Act regulation (R978, reg. 3) lists only 0 (SA citizen) and 1 (non-SA citizen) for the citizenship digit; SARS's OECD TIN sheet adds 2 = refugee, refugee IDs with 2 are issued in practice, and the library accepts them (upstream libraries reject 2). The library does not apply a "holder must be 16+" rule, because IDs are issued at birth. Two-digit years make the number non-unique across centuries.

Sources: https://www.dha.gov.za/index.php/civic-services/identity-documents, https://www.westerncape.gov.za/general-publication/decoding-your-south-african-id-number-0, https://source.acts.co.za/identification-act-1997/r978_3__identity_number.php, https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/South-Africa-TIN.pdf

## Zambia (ZM)

### Zambian National Registration Card Number — `ZM_NRC`

Issued by: Department of National Registration, Passport and Citizenship · Holders: citizens and registered foreigners · Check digit: none known · Confidence: low

**Format:** 9 digits, `SSSSSS/DD/N`. Example: `123456/11/1`. The first card, issued in 1965, was `000001/11/1`.

| Part | Meaning |
|---|---|
| `SSSSSS` | Sequential number within the issuing district, from 000001 |
| `DD` | District: first digit province, second district (11 Lusaka, 61 Ndola, 82 Mongu) |
| `N` | Nationality: 1 Zambian, 2 Commonwealth citizen, 3 other foreigner |

**Check digit:** none known. The library checks length, pattern and a nationality digit of 1–3; sequence 000000 is rejected as never issued.

**What the library extracts:** citizenship, district code (no names; no full table is published), province digit, serial.

**Caveats:** Every source agrees on the 6/2/1 shape, but the meaning of each part comes from one newspaper explainer. Newer biometric cards are reported to carry a new 13-digit number, which the library does not cover.

Sources: https://zambianobserver.com/the-national-registration-card-was-introduced-in-1965-the-first-card-000001-11-1-was-issued-to-kaunda/, https://github.com/Munalula-Sikazwe/ZamAuthentic, https://docs.dojah.io/api-reference/individual-verification/zambia/national-id.md

## Zimbabwe (ZW)

### Zimbabwean National Registration Number — `ZW_NID`

Issued by: Registrar General's Office · Holders: citizens and registered foreign residents · Check digit: mod 23 letter · Confidence: moderate

**Format:** 11–12 characters, `RR NNNNNN(N) L DD`, written `63-123456 B 02`. Example: `63123456B02`.

| Part | Meaning |
|---|---|
| `RR` | Registration office that issued the number |
| `NNNNNN(N)` | 6- or 7-digit sequence |
| `L` | Check letter |
| `DD` | District of origin; 00 for foreign nationals |

**Check digit:** take `RR` and the sequence together as one integer, divide by 23, and use the remainder as an index (from 0) into `ZABCDEFGHJKLMNPQRSTVWXY` (no I, O, U). For `63123456`: 63123456 mod 23 = 2 → `B`. The district after the letter is not covered by the check.

**What the library extracts:** district (as region), foreigner status for district 00, registration office, check letter, sequence as serial.

**Caveats:** The registrar does not publish the scheme. The letter rule comes from the 2018 Pachedu voters'-roll analysis and reproduces the sample IDs. Many validators accept any letter. idnumbers uses the digit sum mod 23 instead of the number itself, which rejects most real IDs; the library uses the number. Office/district codes are checked against a known list from the same report.

Sources: https://www.slideshare.net/slideshow/zimbabwe-2018-biometric-voters-roll-analysis-pachedu/106248017, https://github.com/identique/idnumbers/issues/315, https://trueidzim.com/articles/zimbabwe-id-number-explained, https://en.wikipedia.org/wiki/National_identification_number#Zimbabwe

## Territories covered through a parent country

These places have no ID number of their own (or use the parent's). Passing one of them as `country` tries the parent country's documents, which are explained in that country's section above.

| Territory | Uses |
|---|---|
| American Samoa (AS) | United States (US) |
| Guam (GU) | United States (US) |
| Northern Mariana Islands (MP) | United States (US) |
| Puerto Rico (PR) | United States (US) |
| U.S. Virgin Islands (VI) | United States (US) |
| U.S. Outlying Islands (UM) | United States (US) |
| St. Barthélemy (BL) | France (FR) |
| St. Martin (MF) | France (FR) |
| French Guiana (GF) | France (FR) |
| Guadeloupe (GP) | France (FR) |
| Martinique (MQ) | France (FR) |
| Réunion (RE) | France (FR) |
| Mayotte (YT) | France (FR) |
| St. Pierre & Miquelon (PM) | France (FR) |
| New Caledonia (NC) | France (FR) |
| French Polynesia (PF) | France (FR) |
| Wallis & Futuna (WF) | France (FR) |
| French Southern Territories (TF) | France (FR) |
| Caribbean Netherlands (BQ) | Netherlands (NL) |
| Åland Islands (AX) | Finland (FI) |
| Greenland (GL) | Denmark (DK) |
| Svalbard & Jan Mayen (SJ) | Norway (NO) |
| Bouvet Island (BV) | Norway (NO) |
| Cocos (Keeling) Islands (CC) | Australia (AU) |
| Christmas Island (CX) | Australia (AU) |
| Norfolk Island (NF) | Australia (AU) |
| Heard & McDonald Islands (HM) | Australia (AU) |
| Tokelau (TK) | New Zealand (NZ) |

## Places not supported

These were researched, but no documented number format was found. Official specifications or sample numbers would let them be added. [`COVERAGE.md`](COVERAGE.md) keeps the current list.

| Country | Why |
|---|---|
| Antigua & Barbuda (AG) | OECD sheet gives only a minimum length (6 digits). |
| Antarctica (AQ) | No permanent population or civil registry. |
| Burkina Faso (BF) | Only one gazette sample for the IFU; card number format unpublished. |
| Burundi (BI) | No format found. |
| Bermuda (BM) | No TIN issued; social insurance number format unpublished. |
| Bahamas (BS) | No TIN (no direct taxes); National Insurance number format not found. |
| Central African Republic (CF) | Neither the ID agency nor the tax administration publishes a structure. |
| Congo - Brazzaville (CG) | Neither the ID agency nor the tax administration publishes a structure. |
| Côte d’Ivoire (CI) | Neither the ID agency (ONECI) nor the tax administration publishes a structure. |
| Cape Verde (CV) | No format found. |
| Djibouti (DJ) | Neither the ID agency nor the tax administration publishes a structure. |
| Western Sahara (EH) | Disputed territory: residents hold Moroccan CNIE or Sahrawi documents; mapping it would be a political choice. |
| Eritrea (ER) | No format found. |
| Falkland Islands (FK) | No own ID number format found. |
| Micronesia (FM) | No official format found. |
| Gabon (GA) | Neither the ID agency nor the tax administration publishes a structure. |
| Gibraltar (GI) | Tax number is "numerals only, assigned chronologically" with no length; ID card format unpublished. |
| Gambia (GM) | Only source is self-contradictory (says 11 digits, shows a 12-character form). |
| Equatorial Guinea (GQ) | Neither the ID agency nor the tax administration publishes a structure. |
| South Georgia & South Sandwich Islands (GS) | No permanent population or civil registry. |
| Guinea-Bissau (GW) | No format found. |
| Guyana (GY) | Revenue authority doesn't publish the TIN format; no OECD sheet. |
| British Indian Ocean Territory (IO) | No permanent civil population. |
| Kiribati (KI) | No official format found. |
| Comoros (KM) | Neither the ID agency nor the tax administration publishes a structure. |
| St. Kitts & Nevis (KN) | OECD sheet says "numeric" with no length. |
| North Korea (KP) | No publicly documented ID number. |
| Cayman Islands (KY) | No TIN issued; no published personal number format. |
| Monaco (MC) | Issues no TIN; no national ID number format found. |
| Mauritania (MR) | No format found (research budget ran out). |
| Montserrat (MS) | No TIN issued; no published personal number format. |
| Malawi (MW) | Registration bureau, UNDP reports and KYC vendors give no number format. |
| Niger (NE) | Neither the ID agency nor the tax administration publishes a structure. |
| Niue (NU) | Niueans are NZ citizens but NZ has no national ID number; no own number found. |
| Pitcairn Islands (PN) | No own ID or tax number; tiny population. |
| Palau (PW) | No official format found. |
| Solomon Islands (SB) | No official format found. |
| Sudan (SD) | No format found. |
| St. Helena (SH) | No own ID number format found. |
| Sierra Leone (SL) | No format found. |
| South Sudan (SS) | Revenue authority states it publishes no TIN format; no ID format found. |
| São Tomé & Príncipe (ST) | No format found. |
| Sint Maarten (SX) | CRIB numbers pass an "11-proof" per the OECD sheet, but neither length nor weights are published. |
| Syria (SY) | Law creates a national number but doesn't publish its structure. |
| Turks & Caicos Islands (TC) | No TIN issued; no published personal number format. |
| Chad (TD) | Neither the ID agency nor the tax administration publishes a structure. |
| Togo (TG) | Neither the ID agency nor the tax administration publishes a structure. |
| Timor-Leste (TL) | No format found for the ID or tax number. |
| Turkmenistan (TM) | No format found (research budget ran out). |
| Tonga (TO) | No official format found. |
| Tuvalu (TV) | No official format found. |
| Vatican City (VA) | No source found. |
| St. Vincent & Grenadines (VC) | OECD sheet says "numeric" with no length. |
| British Virgin Islands (VG) | No TIN issued; no published personal number format. |
| Vanuatu (VU) | OECD sheet gives no format. |
| Samoa (WS) | Tax authority says its TIN is a plain sequential number with no structure. |
| Kosovo (XK) | Only a commercial page gives a length (10 digits); no structure. |
| Yemen (YE) | Law creates a national number but doesn't publish its structure. |
