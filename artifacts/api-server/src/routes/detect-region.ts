import { Router } from "express";
import type { Request } from "express";

const router = Router();

const IP_COUNTRY_HINTS: Array<{ prefix: string; region: string }> = [
  { prefix: "86.", region: "CN" },
  { prefix: "1.", region: "US" },
  { prefix: "44.", region: "GB" },
  { prefix: "1.6", region: "CA" },
  { prefix: "1.7", region: "CA" },
  { prefix: "49.", region: "DE" },
  { prefix: "33.", region: "FR" },
  { prefix: "81.", region: "JP" },
  { prefix: "971.", region: "AE" },
  { prefix: "65.", region: "SG" },
  { prefix: "91.", region: "IN" },
  { prefix: "55.", region: "BR" },
  { prefix: "61.", region: "AU" },
  { prefix: "27.", region: "ZA" },
  { prefix: "52.", region: "MX" },
];

function guessRegionFromIp(ip: string): string | null {
  for (const hint of IP_COUNTRY_HINTS) {
    if (ip.startsWith(hint.prefix)) return hint.region;
  }
  return null;
}

router.get("/detect-region", (req: Request, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress ?? "";

  const region = guessRegionFromIp(ip);
  res.json({ region, ip_detected: !!region });
});

export default router;
