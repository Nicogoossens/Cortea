import { Router } from "express";
import type { Request } from "express";

const router = Router();

const PRIVATE_PREFIXES = ["127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."];

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "localhost") return true;
  return PRIVATE_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

async function guessRegionFromIp(ip: string): Promise<string | null> {
  if (!ip || isPrivateIp(ip)) return null;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal },
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json() as { status?: string; countryCode?: string };
    if (data.status === "success" && data.countryCode) {
      return data.countryCode.toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

router.get("/detect-region", async (req: Request, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress ?? "";

  const ip = rawIp.replace(/^::ffff:/, "");
  const region = await guessRegionFromIp(ip);
  res.json({ region, ip_detected: !!region });
});

export default router;
