import { db } from "./index.js";
import { compassRegionsTable } from "./schema/compass_regions.js";

function flag(code: string): string {
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
}

const WORLD_CODES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GT","GU","GW","GY",
  "HK","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "YE","YT",
  "ZA","ZM","ZW",
];

async function seedWorldStubs() {
  console.log(`Seeding ${WORLD_CODES.length} world country stubs (onConflictDoNothing)...`);
  let inserted = 0;
  for (const code of WORLD_CODES) {
    const result = await db.insert(compassRegionsTable)
      .values({
        region_code: code,
        flag_emoji: flag(code),
        is_published: false,
        content: {},
      })
      .onConflictDoNothing()
      .returning({ region_code: compassRegionsTable.region_code });
    if (result.length > 0) inserted++;
  }
  console.log(`World stubs complete. ${inserted} new stubs inserted (${WORLD_CODES.length - inserted} already existed).`);
}

export { seedWorldStubs as runWorldStubsSeed };

if (process.argv[1] && process.argv[1].includes("seed-world-stubs.ts")) {
  seedWorldStubs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("World stubs seed failed:", err);
      process.exit(1);
    });
}
