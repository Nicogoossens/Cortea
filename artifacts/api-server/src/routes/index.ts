import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import cultureRouter from "./culture";
import scenariosRouter from "./scenarios";
import nobleScoreRouter from "./noble_score";
import translationsRouter from "./translations";
import counselRouter from "./counsel";
import detectRegionRouter from "./detect-region";
import authRouter from "./auth";
import adminRouter from "./admin";
import subscriptionRouter from "./subscription";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cultureRouter);
router.use(scenariosRouter);
router.use(nobleScoreRouter);
router.use(translationsRouter);
router.use(counselRouter);
router.use(detectRegionRouter);
router.use(adminRouter);
router.use(subscriptionRouter);

export default router;
