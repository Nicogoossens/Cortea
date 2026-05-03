/**
 * getOrigin — resolves the public base URL used to build OAuth callback URIs.
 *
 * Resolution order:
 *  1. APP_PUBLIC_URL env var (set in production to https://sowiso-01.replit.app)
 *  2. Derived from the incoming request (protocol + hostname)
 *
 * Trailing slashes are stripped so callers can safely append "/path".
 *
 * Exported so it can be unit-tested without instantiating an HTTP server.
 */
import type { Request } from "express";

export function getOrigin(req: Request): string {
  if (process.env.APP_PUBLIC_URL) {
    return process.env.APP_PUBLIC_URL.replace(/\/$/, "");
  }
  return `${req.protocol}://${req.hostname}`;
}
