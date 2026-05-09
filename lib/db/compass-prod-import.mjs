#!/usr/bin/env node
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ── COUNTRY_CODES (copied from compass-md-parser.ts) ─────────────────────────
const COUNTRY_CODES = {
  Australia:"AU",Belgium:"BE",Brazil:"BR",Canada:"CA",China:"CN",Colombia:"CO",Germany:"DE",France:"FR",India:"IN",Italy:"IT",Japan:"JP",Mexico:"MX",Netherlands:"NL",Portugal:"PT",Singapore:"SG",Spain:"ES","UAE/Dubai":"AE","United Arab Emirates":"AE",UAE:"AE","United Kingdom":"GB","United States":"US","South Africa":"ZA",Switzerland:"CH",
  Austria:"AT","Czech Republic":"CZ",Czechia:"CZ",Denmark:"DK",Finland:"FI",Greece:"GR",Hungary:"HU",Ireland:"IE",Norway:"NO",Poland:"PL",Romania:"RO",Sweden:"SE",Turkey:"TR","Türkiye (Turkey)":"TR","Türkiye":"TR",
  Albania:"AL",Andorra:"AD","Bosnia and Herzegovina":"BA",Bulgaria:"BG",Croatia:"HR",Cyprus:"CY",Estonia:"EE","Faroe Islands":"FO",Georgia:"GE",Iceland:"IS",Kosovo:"XK",Latvia:"LV",Liechtenstein:"LI",Lithuania:"LT",Luxembourg:"LU",Malta:"MT",Moldova:"MD",Monaco:"MC",Montenegro:"ME","North Macedonia":"MK","San Marino":"SM",Serbia:"RS",Slovakia:"SK",Slovenia:"SI",Ukraine:"UA","Vatican City":"VA",
  Bangladesh:"BD",Cambodia:"KH",Indonesia:"ID","South Korea":"KR",Malaysia:"MY",Maldives:"MV",Mongolia:"MN",Myanmar:"MM",Nepal:"NP",Pakistan:"PK",Philippines:"PH","Sri Lanka":"LK",Taiwan:"TW",Thailand:"TH",Vietnam:"VN",
  Afghanistan:"AF",Azerbaijan:"AZ",Bhutan:"BT","Brunei Darussalam":"BN",Brunei:"BN","Hong Kong":"HK",Kazakhstan:"KZ",Kyrgyzstan:"KG",Laos:"LA",Macau:"MO","North Korea":"KP",Tajikistan:"TJ","Timor-Leste":"TL",Turkmenistan:"TM",Uzbekistan:"UZ",
  Bahrain:"BH",Iran:"IR",Iraq:"IQ",Israel:"IL",Jordan:"JO",Kuwait:"KW",Lebanon:"LB",Oman:"OM",Palestine:"PS",Qatar:"QA","Saudi Arabia":"SA",Syria:"SY",Yemen:"YE",
  Algeria:"DZ",Angola:"AO",Botswana:"BW",Cameroon:"CM","Côte d'Ivoire":"CI","Ivory Coast":"CI",Egypt:"EG",Ethiopia:"ET",Ghana:"GH",Kenya:"KE",Libya:"LY",Madagascar:"MG",Malawi:"MW",Mali:"ML",Mauritius:"MU",Morocco:"MA",Mozambique:"MZ",Namibia:"NA",Nigeria:"NG",Rwanda:"RW",Senegal:"SN","Sierra Leone":"SL",Sudan:"SD","South Sudan":"SS",Tanzania:"TZ",Tunisia:"TN",Uganda:"UG",Zambia:"ZM",Zimbabwe:"ZW",
  Benin:"BJ",Burundi:"BI","Burkina Faso":"BF","Cape Verde":"CV","Central African Republic":"CF",Chad:"TD",Comoros:"KM","Democratic Republic of the Congo":"CD","Republic of the Congo":"CG",Djibouti:"DJ","Equatorial Guinea":"GQ",Eritrea:"ER",Eswatini:"SZ",Gabon:"GA",Gambia:"GM",Guinea:"GN","Guinea-Bissau":"GW",Lesotho:"LS",Liberia:"LR",Mauritania:"MR",Niger:"NE","São Tomé and Príncipe":"ST",Somalia:"SO",Togo:"TG",
  Argentina:"AR",Bolivia:"BO",Chile:"CL","Costa Rica":"CR",Cuba:"CU","Dominican Republic":"DO",Ecuador:"EC","El Salvador":"SV",Guatemala:"GT",Haiti:"HT",Honduras:"HN",Jamaica:"JM",Nicaragua:"NI",Panama:"PA",Paraguay:"PY",Peru:"PE","Puerto Rico":"PR",Uruguay:"UY",Venezuela:"VE",
  "Antigua and Barbuda":"AG",Barbados:"BB",Belize:"BZ",Bermuda:"BM","Cayman Islands":"KY",Dominica:"DM",Grenada:"GD",Guyana:"GY","Saint Kitts and Nevis":"KN","Saint Lucia":"LC","Saint Vincent and the Grenadines":"VC","Saint-Barthélemy":"BL",Suriname:"SR","Trinidad and Tobago":"TT","Turks and Caicos":"TC",
  Fiji:"FJ",Kiribati:"KI","Marshall Islands":"MH",Micronesia:"FM","Federated States of Micronesia":"FM",Nauru:"NR","New Zealand":"NZ",Palau:"PW","Papua New Guinea":"PG",Samoa:"WS","Solomon Islands":"SB",Tonga:"TO",Tuvalu:"TV",Vanuatu:"VU",
  "Curaçao":"CW","French Polynesia":"PF",
};

// ── Parser ────────────────────────────────────────────────────────────────────
function stripMd(s){return s.replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").trim();}
function splitCountries(md){
  const lines=md.split("\n");const sections=[];let cur=null;
  for(const line of lines){const m=line.match(/^##\s+(\S+)\s+(.+)$/);
    if(m&&/[\u{1F1E6}-\u{1F1FF}]/u.test(m[1])){if(cur)sections.push(cur);cur={name:m[2].trim(),flag:m[1],lines:[]};}
    else if(cur)cur.lines.push(line);}
  if(cur)sections.push(cur);return sections;}
function findSection(lines,h){const i=lines.findIndex(l=>l.trim()===`### ${h}`);if(i<0)return[];const out=[];
  for(let j=i+1;j<lines.length;j++){if(lines[j].startsWith("##"))break;out.push(lines[j]);}return out;}
function findSubsection(bl,h){const re=new RegExp(`^\\*\\*[^*]*${h.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}[^*]*\\*\\*\\s*$`);
  const i=bl.findIndex(l=>re.test(l.trim()));if(i<0)return"";const out=[];
  for(let j=i+1;j<bl.length;j++){const t=bl[j].trim();if(t.startsWith("**")&&t.endsWith("**"))break;if(t.startsWith("###"))break;out.push(t);}
  return out.filter(Boolean).join(" ").trim();}
function findBulletList(bl,h){const re=new RegExp(`^\\*\\*${h}\\*\\*\\s*$`);const i=bl.findIndex(l=>re.test(l.trim()));if(i<0)return[];
  const out=[];for(let j=i+1;j<bl.length;j++){const t=bl[j].trim();if(!t){if(out.length)break;else continue;}
    if(t.startsWith("**")&&t.endsWith("**"))break;if(t.startsWith("- "))out.push(stripMd(t.slice(2).trim()));else if(out.length)break;}return out;}
function scoreContent(c){if(!c)return -1;
  const tf=[c.core_value,c.biggest_taboo,c.dining_etiquette,c.language_notes,c.gift_protocol,c.dress_code];
  return tf.filter(f=>f&&f.trim()).length*200+tf.reduce((s,f)=>s+(f?.length??0),0)+((c.dos?.length??0)+(c.donts?.length??0))*50;}
function parseCompassMd(mdTexts){
  const byCode=new Map();const skipped=[];const errors=[];
  for(const md of mdTexts){for(const section of splitCountries(md)){
    const code=COUNTRY_CODES[section.name];
    if(!code){if(!skipped.includes(section.name))skipped.push(section.name);continue;}
    try{const lines=section.lines;const bl=findSection(lines,"Quick Briefing");
      const dos=findBulletList(bl,"Do");const donts=findBulletList(bl,"Avoid");
      const coreValue=stripMd(findSection(lines,"Core Value").filter(Boolean).join(" "));
      const biggestTaboo=stripMd(findSection(lines,"Biggest Taboo").filter(Boolean).join(" "));
      const pb=findSection(lines,"Essential Protocols");
      byCode.set(code,{region_code:code,flag_emoji:section.flag,region_name:section.name,
        content_en_gb:{region_name:section.name,core_value:coreValue,biggest_taboo:biggestTaboo,
          dining_etiquette:stripMd(findSubsection(pb,"Table Manners")),language_notes:stripMd(findSubsection(pb,"Language Notes")),
          gift_protocol:stripMd(findSubsection(pb,"Gift Protocol")),dress_code:stripMd(findSubsection(pb,"Dress Code")),dos,donts}});}
    catch(e){errors.push(`${section.name} (${code}): ${e.message}`);}}}
  return{countries:Array.from(byCode.values()),skipped,errors};}

// ── Main ──────────────────────────────────────────────────────────────────────
const prodUrl=process.env.PROD_DATABASE_URL;
if(!prodUrl){console.error("PROD_DATABASE_URL not set");process.exit(1);}

const assetsDir="/home/runner/workspace/attached_assets";
const files=readdirSync(assetsDir).filter(f=>/^Compas_database.*\.md$/i.test(f)).sort();
const mdTexts=files.map(f=>readFileSync(join(assetsDir,f),"utf-8"));
const{countries,skipped,errors}=parseCompassMd(mdTexts);
console.log(`Parser: ${countries.length} countries | ${skipped.length} skipped | ${errors.length} errors`);

const client=new pg.Client({connectionString:prodUrl,ssl:{rejectUnauthorized:false}});
await client.connect();

const{rows:[{n:before}]}=await client.query("SELECT COUNT(*)::int AS n FROM compass_regions WHERE is_published=true");
console.log(`Prod DB BEFORE: ${before} published regions`);

let imported=0,updated=0,preserved=0;
for(const country of countries){
  const enGb=country.content_en_gb;
  const ins=await client.query(
    `INSERT INTO compass_regions (region_code,flag_emoji,content,is_published) VALUES ($1,$2,$3::jsonb,true) ON CONFLICT (region_code) DO NOTHING RETURNING region_code`,
    [country.region_code,country.flag_emoji,JSON.stringify({"en-GB":enGb})]);
  if(ins.rows.length>0){imported++;}
  else{
    const ex=await client.query(`SELECT content->'en-GB' AS en_gb FROM compass_regions WHERE region_code=$1 LIMIT 1`,[country.region_code]);
    const existingEnGb=ex.rows[0]?.en_gb;
    const inScore=scoreContent(enGb);const exScore=scoreContent(existingEnGb);
    if(inScore>exScore){
      await client.query(
        `UPDATE compass_regions SET content=jsonb_set(COALESCE(content,'{}'),'{en-GB}',$2::jsonb),flag_emoji=$3,is_published=true WHERE region_code=$1`,
        [country.region_code,JSON.stringify(enGb),country.flag_emoji]);
      updated++;
    }else{preserved++;}
  }
}

const{rows:[{n:after}]}=await client.query("SELECT COUNT(*)::int AS n FROM compass_regions WHERE is_published=true");
const{rows:locales}=await client.query(`SELECT jsonb_object_keys(content) AS locale,COUNT(*)::int AS n FROM compass_regions WHERE is_published=true GROUP BY locale ORDER BY n DESC LIMIT 6`);
const{rows:spot}=await client.query(`
  SELECT region_code,flag_emoji,LEFT(content->'en-GB'->>'core_value',55) AS cv
  FROM compass_regions WHERE region_code IN ('IS','HK','TR','MA','AT','DK','KR','RO','UA','TH') AND is_published=true ORDER BY region_code`);

console.log(`\n=== PRODUCTION IMPORT RESULT ===`);
console.log(`  Before  : ${before} regions`);
console.log(`  After   : ${after} regions`);
console.log(`  Inserted: ${imported} new`);
console.log(`  Updated : ${updated} (incoming richer)`);
console.log(`  Preserved: ${preserved} (existing richer/equal)`);
console.log(`  Locale dist: ${locales.map(r=>`${r.locale}:${r.n}`).join(", ")}`);
console.log(`\nSpot-check:`);
spot.forEach(r=>console.log(`  ${r.region_code} ${r.flag_emoji}: ${r.cv||"[empty]"}...`));
await client.end();
console.log(`\n✓ Production import complete`);
