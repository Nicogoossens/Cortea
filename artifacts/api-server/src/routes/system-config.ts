import { Router, type IRouter } from "express";

const router: IRouter = Router();

function isClosedBeta(): boolean {
  return (process.env.CLOSED_BETA ?? "").toLowerCase() === "true";
}

export function isInviteCodeValid(code: string | undefined | null): boolean {
  if (!isClosedBeta()) return true;
  const required = (process.env.BETA_INVITE_CODE ?? "").trim();
  if (!required) return false;
  return typeof code === "string" && code.trim() === required;
}

router.get("/system/registration-status", (_req, res) => {
  res.json({
    registration_open: !isClosedBeta(),
    closed_beta: isClosedBeta(),
  });
});

export default router;
