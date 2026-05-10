import { Router } from "express";
import usersRouter from "./admin/admin-users.js";
import contentRouter from "./admin/admin-content.js";
import ccProtocolsRouter from "./admin/admin-cc-protocols.js";
import useCasesRouter from "./admin/admin-use-cases.js";
import onboardingRouter from "./admin/admin-onboarding.js";
import translationsRouter from "./admin/admin-translations.js";
import counselSeedsRouter from "./admin/admin-counsel-seeds.js";
import importRouter from "./admin/admin-import.js";

const router = Router();

router.use(usersRouter);
router.use(contentRouter);
router.use(ccProtocolsRouter);
router.use(useCasesRouter);
router.use(onboardingRouter);
router.use(translationsRouter);
router.use(counselSeedsRouter);
router.use(importRouter);

export default router;
