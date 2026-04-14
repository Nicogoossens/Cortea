import { Router } from "express";
import type { Request } from "express";

const router = Router();

const CIDR_HINTS: Array<{ start: string; end: string; region: string }> = [
  { start: "1.64.0.0", end: "1.127.255.255", region: "CA" },
  { start: "1.192.0.0", end: "1.255.255.255", region: "CN" },
  { start: "5.0.0.0", end: "5.255.255.255", region: "GB" },
  { start: "8.0.0.0", end: "8.255.255.255", region: "US" },
  { start: "13.0.0.0", end: "13.255.255.255", region: "US" },
  { start: "14.0.0.0", end: "14.255.255.255", region: "AU" },
  { start: "27.0.0.0", end: "27.255.255.255", region: "CN" },
  { start: "36.0.0.0", end: "36.255.255.255", region: "CN" },
  { start: "43.0.0.0", end: "43.255.255.255", region: "JP" },
  { start: "45.0.0.0", end: "45.255.255.255", region: "US" },
  { start: "49.0.0.0", end: "49.255.255.255", region: "AU" },
  { start: "52.0.0.0", end: "52.255.255.255", region: "US" },
  { start: "54.0.0.0", end: "54.255.255.255", region: "US" },
  { start: "58.0.0.0", end: "58.255.255.255", region: "CN" },
  { start: "59.0.0.0", end: "59.255.255.255", region: "CN" },
  { start: "60.0.0.0", end: "60.255.255.255", region: "JP" },
  { start: "66.0.0.0", end: "66.255.255.255", region: "US" },
  { start: "67.0.0.0", end: "67.255.255.255", region: "US" },
  { start: "68.0.0.0", end: "68.255.255.255", region: "US" },
  { start: "69.0.0.0", end: "69.255.255.255", region: "CA" },
  { start: "72.0.0.0", end: "72.255.255.255", region: "US" },
  { start: "76.0.0.0", end: "76.255.255.255", region: "US" },
  { start: "77.0.0.0", end: "77.255.255.255", region: "GB" },
  { start: "78.0.0.0", end: "78.255.255.255", region: "GB" },
  { start: "80.0.0.0", end: "80.255.255.255", region: "DE" },
  { start: "81.0.0.0", end: "81.255.255.255", region: "DE" },
  { start: "82.0.0.0", end: "82.255.255.255", region: "DE" },
  { start: "85.0.0.0", end: "85.255.255.255", region: "GB" },
  { start: "91.0.0.0", end: "91.255.255.255", region: "FR" },
  { start: "101.0.0.0", end: "101.255.255.255", region: "CN" },
  { start: "103.0.0.0", end: "103.255.255.255", region: "IN" },
  { start: "106.0.0.0", end: "106.255.255.255", region: "CN" },
  { start: "110.0.0.0", end: "110.255.255.255", region: "CN" },
  { start: "111.0.0.0", end: "111.255.255.255", region: "CN" },
  { start: "112.0.0.0", end: "112.255.255.255", region: "CN" },
  { start: "113.0.0.0", end: "113.255.255.255", region: "CN" },
  { start: "114.0.0.0", end: "114.255.255.255", region: "CN" },
  { start: "115.0.0.0", end: "115.255.255.255", region: "CN" },
  { start: "116.0.0.0", end: "116.255.255.255", region: "CN" },
  { start: "117.0.0.0", end: "117.255.255.255", region: "CN" },
  { start: "118.0.0.0", end: "118.255.255.255", region: "CN" },
  { start: "119.0.0.0", end: "119.255.255.255", region: "CN" },
  { start: "120.0.0.0", end: "120.255.255.255", region: "CN" },
  { start: "121.0.0.0", end: "121.255.255.255", region: "CN" },
  { start: "122.0.0.0", end: "122.255.255.255", region: "CN" },
  { start: "123.0.0.0", end: "123.255.255.255", region: "JP" },
  { start: "124.0.0.0", end: "124.255.255.255", region: "CN" },
  { start: "125.0.0.0", end: "125.255.255.255", region: "CN" },
  { start: "139.0.0.0", end: "139.255.255.255", region: "IN" },
  { start: "158.0.0.0", end: "158.255.255.255", region: "CA" },
  { start: "162.0.0.0", end: "162.255.255.255", region: "CA" },
  { start: "175.0.0.0", end: "175.255.255.255", region: "CN" },
  { start: "176.0.0.0", end: "176.255.255.255", region: "DE" },
  { start: "180.0.0.0", end: "180.255.255.255", region: "CN" },
  { start: "182.0.0.0", end: "182.255.255.255", region: "CN" },
  { start: "183.0.0.0", end: "183.255.255.255", region: "CN" },
  { start: "184.0.0.0", end: "184.255.255.255", region: "US" },
  { start: "185.0.0.0", end: "185.255.255.255", region: "GB" },
  { start: "188.0.0.0", end: "188.255.255.255", region: "GB" },
  { start: "192.168.0.0", end: "192.168.255.255", region: "GB" },
  { start: "193.0.0.0", end: "193.255.255.255", region: "FR" },
  { start: "194.0.0.0", end: "194.255.255.255", region: "GB" },
  { start: "195.0.0.0", end: "195.255.255.255", region: "GB" },
  { start: "196.0.0.0", end: "196.255.255.255", region: "ZA" },
  { start: "197.0.0.0", end: "197.255.255.255", region: "ZA" },
  { start: "202.0.0.0", end: "202.255.255.255", region: "CN" },
  { start: "210.0.0.0", end: "210.255.255.255", region: "JP" },
  { start: "211.0.0.0", end: "211.255.255.255", region: "CN" },
  { start: "218.0.0.0", end: "218.255.255.255", region: "CN" },
  { start: "220.0.0.0", end: "220.255.255.255", region: "CN" },
  { start: "222.0.0.0", end: "222.255.255.255", region: "CN" },
];

function ipToNum(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return -1;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function guessRegionFromIp(ip: string): string | null {
  const num = ipToNum(ip);
  if (num < 0) return null;
  for (const hint of CIDR_HINTS) {
    const start = ipToNum(hint.start);
    const end = ipToNum(hint.end);
    if (num >= start && num <= end) return hint.region;
  }
  return null;
}

router.get("/detect-region", (req: Request, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress ?? "";

  const ip = rawIp.replace(/^::ffff:/, "");
  const region = guessRegionFromIp(ip);
  res.json({ region, ip_detected: !!region });
});

export default router;
