import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import cultureRouter from "./culture";
import scenariosRouter from "./scenarios";
import nobleScoreRouter from "./noble_score";
import translationsRouter from "./translations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(cultureRouter);
router.use(scenariosRouter);
router.use(nobleScoreRouter);
router.use(translationsRouter);

export default router;
