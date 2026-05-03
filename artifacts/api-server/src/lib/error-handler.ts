import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";

interface ErrorPayload {
  error: string;
  reqId?: string;
  stack?: string;
}

/**
 * Express global error-handling middleware.
 *
 * MUST be registered AFTER all routes (it has the 4-arg signature express
 * uses to dispatch errors). Catches:
 *   - synchronous throws from a route handler
 *   - rejected promises from `async` handlers (Express 5 forwards these
 *     automatically, no need for a wrapper)
 *   - errors passed to `next(err)`
 *
 * Logs via `req.log` (pino-http) when available, falling back to the
 * shared `logger`. The response is always JSON; in production the stack
 * trace is omitted to avoid leaking implementation details.
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const reqId = (req as Request & { id?: string }).id;
  const log = (req as Request & { log?: typeof logger }).log ?? logger;

  log.error({ err, reqId }, "Unhandled error in request");

  if (res.headersSent) {
    // Express will close the connection; nothing else we can do.
    return;
  }

  const payload: ErrorPayload = {
    error: "Internal server error",
  };
  if (reqId) payload.reqId = reqId;
  if (!isProduction && err instanceof Error && err.stack) {
    payload.stack = err.stack;
  }

  res.status(500).json(payload);
}
