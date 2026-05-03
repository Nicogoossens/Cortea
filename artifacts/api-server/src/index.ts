import app from "./app";
import { logger } from "./lib/logger";
import { startCalibrationSweeper } from "./lib/register-calibration-sweeper";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Background safety net: any translations row written directly (CLI scripts,
  // future code paths, ad-hoc SQL) that is a content key with no calibration
  // stamp will be picked up by this sweeper on its next pass, so register
  // calibration is applied automatically with no manual CLI step required.
  startCalibrationSweeper();
});
