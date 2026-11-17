/** ISO 3166-1 alpha-2 → alpha-3 for every assigned code. Names come from Intl (CLDR). */
const RAW =
  "AD AND AE ARE AF AFG AG ATG AI AIA AL ALB AM ARM AO AGO AQ ATA AR ARG AS ASM AT AUT AU AUS AW ABW AX ALA AZ AZE " +
  "BA BIH BB BRB BD BGD BE BEL BF BFA BG BGR BH BHR BI BDI BJ BEN BL BLM BM BMU BN BRN BO BOL BQ BES BR BRA BS BHS " +
  "BT BTN BV BVT BW BWA BY BLR BZ BLZ CA CAN CC CCK CD COD CF CAF CG COG CH CHE CI CIV CK COK CL CHL CM CMR CN CHN " +
  "CO COL CR CRI CU CUB CV CPV CW CUW CX CXR CY CYP CZ CZE DE DEU DJ DJI DK DNK DM DMA DO DOM DZ DZA EC ECU EE EST " +
  "EG EGY EH ESH ER ERI ES ESP ET ETH FI FIN FJ FJI FK FLK FM FSM FO FRO FR FRA GA GAB GB GBR GD GRD GE GEO GF GUF " +
  "GG GGY GH GHA GI GIB GL GRL GM GMB GN GIN GP GLP GQ GNQ GR GRC GS SGS GT GTM GU GUM GW GNB GY GUY HK HKG HM HMD " +
  "HN HND HR HRV HT HTI HU HUN ID IDN IE IRL IL ISR IM IMN IN IND IO IOT IQ IRQ IR IRN IS ISL IT ITA JE JEY JM JAM " +
  "JO JOR JP JPN KE KEN KG KGZ KH KHM KI KIR KM COM KN KNA KP PRK KR KOR KW KWT KY CYM KZ KAZ LA LAO LB LBN LC LCA " +
  "LI LIE LK LKA LR LBR LS LSO LT LTU LU LUX LV LVA LY LBY MA MAR MC MCO MD MDA ME MNE MF MAF MG MDG MH MHL MK MKD " +
  "ML MLI MM MMR MN MNG MO MAC MP MNP MQ MTQ MR MRT MS MSR MT MLT MU MUS MV MDV MW MWI MX MEX MY MYS MZ MOZ NA NAM " +
  "NC NCL NE NER NF NFK NG NGA NI NIC NL NLD NO NOR NP NPL NR NRU NU NIU NZ NZL OM OMN PA PAN PE PER PF PYF PG PNG " +
  "PH PHL PK PAK PL POL PM SPM PN PCN PR PRI PS PSE PT PRT PW PLW PY PRY QA QAT RE REU RO ROU RS SRB RU RUS RW RWA " +
  "SA SAU SB SLB SC SYC SD SDN SE SWE SG SGP SH SHN SI SVN SJ SJM SK SVK SL SLE SM SMR SN SEN SO SOM SR SUR SS SSD " +
  "ST STP SV SLV SX SXM SY SYR SZ SWZ TC TCA TD TCD TF ATF TG TGO TH THA TJ TJK TK TKL TL TLS TM TKM TN TUN TO TON " +
  "TR TUR TT TTO TV TUV TW TWN TZ TZA UA UKR UG UGA UM UMI US USA UY URY UZ UZB VA VAT VC VCT VE VEN VG VGB VI VIR " +
  "VN VNM VU VUT WF WLF WS WSM XK XKX YE YEM YT MYT ZA ZAF ZM ZMB ZW ZWE";

const tokens = RAW.split(" ");
const A2_TO_A3 = new Map<string, string>();
const A3_TO_A2 = new Map<string, string>();
for (let i = 0; i < tokens.length; i += 2) {
  A2_TO_A3.set(tokens[i]!, tokens[i + 1]!);
  A3_TO_A2.set(tokens[i + 1]!, tokens[i]!);
}

let names: Intl.DisplayNames | undefined;
try {
  names = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  names = undefined;
}

export function alpha3Of(alpha2: string): string | undefined {
  return A2_TO_A3.get(alpha2);
}

export function countryName(alpha2: string): string {
  return names?.of(alpha2) ?? alpha2;
}

/** Alpha-2 for an alpha-2 or alpha-3 code, any case. Undefined for unknown codes. */
export function toAlpha2(code: string): string | undefined {
  if (typeof code !== "string") return undefined;
  const c = code.trim().toUpperCase();
  if (c.length === 2) return A2_TO_A3.has(c) ? c : c === "UK" ? "GB" : undefined;
  if (c.length === 3) return A3_TO_A2.get(c);
  return undefined;
}

/**
 * Territories whose residents use another country's ID documents. When the
 * caller passes one of these as `country`, the parent's documents are tried
 * too (after the territory's own, if it has any). Matches report the issuing
 * country, e.g. `country: "PR"` matches `US_SSN` with `match.country === "US"`.
 */
export const TERRITORY_PARENTS: Readonly<Record<string, readonly string[]>> = {
  // United States
  AS: ["US"], GU: ["US"], MP: ["US"], PR: ["US"], VI: ["US"], UM: ["US"],
  // France: overseas departments and collectivities use the NIR
  BL: ["FR"], MF: ["FR"], GF: ["FR"], GP: ["FR"], MQ: ["FR"], RE: ["FR"], YT: ["FR"],
  PM: ["FR"], NC: ["FR"], PF: ["FR"], WF: ["FR"], TF: ["FR"],
  // Caribbean Netherlands: residents get a BSN since 2025 (rijksdienstcn.com, RvIG W181)
  BQ: ["NL"],
  // Nordics
  AX: ["FI"], GL: ["DK"], SJ: ["NO"], BV: ["NO"],
  // Australia's external territories
  CC: ["AU"], CX: ["AU"], NF: ["AU"], HM: ["AU"],
  // New Zealand realm
  TK: ["NZ"],
  // UK: Isle of Man uses the National Insurance number
  IM: ["GB"],
};

/** The country itself followed by any parents whose documents also apply. */
export function documentCountries(alpha2: string): string[] {
  return [alpha2, ...(TERRITORY_PARENTS[alpha2] ?? [])];
}
