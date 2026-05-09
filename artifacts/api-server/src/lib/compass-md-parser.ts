/**
 * Compass Markdown Parser
 * Parses Cortéa Compass database markdown files into structured country data
 * suitable for upserting into compass_regions.
 *
 * Extracted and adapted from lib/db/src/seed-compass-database3.mjs.
 */

export interface CompassCountryData {
  region_code: string;
  flag_emoji: string;
  region_name: string;
  content_en_gb: {
    region_name: string;
    core_value: string;
    biggest_taboo: string;
    dining_etiquette: string;
    language_notes: string;
    gift_protocol: string;
    dress_code: string;
    dos: string[];
    donts: string[];
  };
}

// ─── Comprehensive country→ISO-2 mapping ──────────────────────────────────────

export const COUNTRY_CODES: Record<string, string> = {
  // 21 original active countries
  Australia: "AU",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  China: "CN",
  Colombia: "CO",
  Germany: "DE",
  France: "FR",
  India: "IN",
  Italy: "IT",
  Japan: "JP",
  Mexico: "MX",
  Netherlands: "NL",
  Portugal: "PT",
  Singapore: "SG",
  Spain: "ES",
  "UAE/Dubai": "AE",
  "United Arab Emirates": "AE",
  UAE: "AE",
  "United Kingdom": "GB",
  "United States": "US",
  "South Africa": "ZA",
  Switzerland: "CH",

  // Europe — wave 1
  Austria: "AT",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Denmark: "DK",
  Finland: "FI",
  Greece: "GR",
  Hungary: "HU",
  Ireland: "IE",
  Norway: "NO",
  Poland: "PL",
  Romania: "RO",
  Sweden: "SE",
  Turkey: "TR",
  "Türkiye (Turkey)": "TR",
  Türkiye: "TR",

  // Europe — wave 2 & 3
  Albania: "AL",
  Andorra: "AD",
  "Bosnia and Herzegovina": "BA",
  Bulgaria: "BG",
  Croatia: "HR",
  Cyprus: "CY",
  Estonia: "EE",
  "Faroe Islands": "FO",
  Georgia: "GE",
  Iceland: "IS",
  Kosovo: "XK",
  Latvia: "LV",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Malta: "MT",
  Moldova: "MD",
  Monaco: "MC",
  Montenegro: "ME",
  "North Macedonia": "MK",
  "San Marino": "SM",
  Serbia: "RS",
  Slovakia: "SK",
  Slovenia: "SI",
  Ukraine: "UA",
  "Vatican City": "VA",

  // Asia — wave 1
  Bangladesh: "BD",
  Cambodia: "KH",
  Indonesia: "ID",
  "South Korea": "KR",
  Malaysia: "MY",
  Maldives: "MV",
  Mongolia: "MN",
  Myanmar: "MM",
  Nepal: "NP",
  Pakistan: "PK",
  Philippines: "PH",
  "Sri Lanka": "LK",
  Taiwan: "TW",
  Thailand: "TH",
  Vietnam: "VN",

  // Asia — wave 2
  Afghanistan: "AF",
  Azerbaijan: "AZ",
  Bhutan: "BT",
  "Brunei Darussalam": "BN",
  Brunei: "BN",
  "Hong Kong": "HK",
  Kazakhstan: "KZ",
  Kyrgyzstan: "KG",
  Laos: "LA",
  Macau: "MO",
  "North Korea": "KP",
  Tajikistan: "TJ",
  "Timor-Leste": "TL",
  Turkmenistan: "TM",
  Uzbekistan: "UZ",

  // Middle East
  Bahrain: "BH",
  Iran: "IR",
  Iraq: "IQ",
  Israel: "IL",
  Jordan: "JO",
  Kuwait: "KW",
  Lebanon: "LB",
  Oman: "OM",
  Palestine: "PS",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Syria: "SY",
  Yemen: "YE",

  // Africa — wave 1
  Algeria: "DZ",
  Angola: "AO",
  Botswana: "BW",
  Cameroon: "CM",
  "Côte d'Ivoire": "CI",
  "Ivory Coast": "CI",
  Egypt: "EG",
  Ethiopia: "ET",
  Ghana: "GH",
  Kenya: "KE",
  Libya: "LY",
  Madagascar: "MG",
  Malawi: "MW",
  Mali: "ML",
  Mauritius: "MU",
  Morocco: "MA",
  Mozambique: "MZ",
  Namibia: "NA",
  Nigeria: "NG",
  Rwanda: "RW",
  Senegal: "SN",
  "Sierra Leone": "SL",
  Sudan: "SD",
  "South Sudan": "SS",
  Tanzania: "TZ",
  Tunisia: "TN",
  Uganda: "UG",
  Zambia: "ZM",
  Zimbabwe: "ZW",

  // Africa — wave 2
  Benin: "BJ",
  Burundi: "BI",
  "Burkina Faso": "BF",
  "Cape Verde": "CV",
  "Central African Republic": "CF",
  Chad: "TD",
  Comoros: "KM",
  "Democratic Republic of the Congo": "CD",
  "Republic of the Congo": "CG",
  Djibouti: "DJ",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Eswatini: "SZ",
  Gabon: "GA",
  Gambia: "GM",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Lesotho: "LS",
  Liberia: "LR",
  Mauritania: "MR",
  Niger: "NE",
  "São Tomé and Príncipe": "ST",
  Somalia: "SO",
  "South Africa (ZA)": "ZA",
  Togo: "TG",

  // Americas — wave 1
  Argentina: "AR",
  Bolivia: "BO",
  Chile: "CL",
  "Costa Rica": "CR",
  Cuba: "CU",
  "Dominican Republic": "DO",
  Ecuador: "EC",
  "El Salvador": "SV",
  Guatemala: "GT",
  Haiti: "HT",
  Honduras: "HN",
  Jamaica: "JM",
  Nicaragua: "NI",
  Panama: "PA",
  Paraguay: "PY",
  Peru: "PE",
  "Puerto Rico": "PR",
  Uruguay: "UY",
  Venezuela: "VE",

  // Americas — wave 2
  "Antigua and Barbuda": "AG",
  Barbados: "BB",
  Belize: "BZ",
  Bermuda: "BM",
  "Cayman Islands": "KY",
  Dominica: "DM",
  Grenada: "GD",
  Guyana: "GY",
  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  "Saint-Barthélemy": "BL",
  Suriname: "SR",
  "Trinidad and Tobago": "TT",
  "Turks and Caicos": "TC",

  // Oceania
  Fiji: "FJ",
  Kiribati: "KI",
  "Marshall Islands": "MH",
  Micronesia: "FM",
  "Federated States of Micronesia": "FM",
  Nauru: "NR",
  "New Zealand": "NZ",
  Palau: "PW",
  "Papua New Guinea": "PG",
  Samoa: "WS",
  "Solomon Islands": "SB",
  Tonga: "TO",
  Tuvalu: "TV",
  Vanuatu: "VU",

  // Special admin regions / territories
  Curaçao: "CW",
  "French Polynesia": "PF",
};

// ─── Parsing helpers ───────────────────────────────────────────────────────────

function stripMd(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").trim();
}

interface CountrySection {
  name: string;
  flag: string;
  lines: string[];
}

function splitCountries(md: string): CountrySection[] {
  const lines = md.split("\n");
  const sections: CountrySection[] = [];
  let cur: CountrySection | null = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(\S+)\s+(.+)$/);
    if (m && /[\u{1F1E6}-\u{1F1FF}]/u.test(m[1])) {
      if (cur) sections.push(cur);
      cur = { name: m[2].trim(), flag: m[1], lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

function findSection(lines: string[], heading: string): string[] {
  const idx = lines.findIndex((l) => l.trim() === `### ${heading}`);
  if (idx < 0) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("### ") || lines[i].startsWith("## ") || lines[i].startsWith("# ")) break;
    out.push(lines[i]);
  }
  return out;
}

function findSubsection(blockLines: string[], heading: string): string {
  const re = new RegExp(`^\\*\\*[^*]*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^*]*\\*\\*\\s*$`);
  const idx = blockLines.findIndex((l) => re.test(l.trim()));
  if (idx < 0) return "";
  const out: string[] = [];
  for (let i = idx + 1; i < blockLines.length; i++) {
    const t = blockLines[i].trim();
    if (t.startsWith("**") && t.endsWith("**")) break;
    if (t.startsWith("###")) break;
    out.push(t);
  }
  return out.filter(Boolean).join(" ").trim();
}

function findBulletList(blockLines: string[], heading: string): string[] {
  const re = new RegExp(`^\\*\\*${heading}\\*\\*\\s*$`);
  const idx = blockLines.findIndex((l) => re.test(l.trim()));
  if (idx < 0) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < blockLines.length; i++) {
    const t = blockLines[i].trim();
    if (!t) { if (out.length) break; else continue; }
    if (t.startsWith("**") && t.endsWith("**")) break;
    if (t.startsWith("- ")) out.push(stripMd(t.slice(2).trim()));
    else if (out.length) break;
  }
  return out;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse one or more Compass database markdown texts into structured country data.
 * Countries whose name is not in COUNTRY_CODES are silently skipped.
 */
export function parseCompassMd(mdTexts: string[]): {
  countries: CompassCountryData[];
  skipped: string[];
  errors: string[];
} {
  const countries: CompassCountryData[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const md of mdTexts) {
    const sections = splitCountries(md);
    for (const section of sections) {
      const code = COUNTRY_CODES[section.name];
      if (!code) {
        skipped.push(section.name);
        continue;
      }
      if (seen.has(code)) continue; // deduplicate
      seen.add(code);

      try {
        const lines = section.lines;

        const briefingLines = findSection(lines, "Quick Briefing");
        const dos = findBulletList(briefingLines, "Do");
        const donts = findBulletList(briefingLines, "Avoid");

        const coreValue = stripMd(findSection(lines, "Core Value").filter(Boolean).join(" "));
        const biggestTaboo = stripMd(findSection(lines, "Biggest Taboo").filter(Boolean).join(" "));

        const protocolBlock = findSection(lines, "Essential Protocols");
        const diningEtiquette = stripMd(findSubsection(protocolBlock, "Table Manners"));
        const languageNotes = stripMd(findSubsection(protocolBlock, "Language Notes"));
        const giftProtocol = stripMd(findSubsection(protocolBlock, "Gift Protocol"));
        const dressCode = stripMd(findSubsection(protocolBlock, "Dress Code"));

        countries.push({
          region_code: code,
          flag_emoji: section.flag,
          region_name: section.name,
          content_en_gb: {
            region_name: section.name,
            core_value: coreValue,
            biggest_taboo: biggestTaboo,
            dining_etiquette: diningEtiquette,
            language_notes: languageNotes,
            gift_protocol: giftProtocol,
            dress_code: dressCode,
            dos,
            donts,
          },
        });
      } catch (err: unknown) {
        errors.push(`${section.name} (${code}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return { countries, skipped, errors };
}
