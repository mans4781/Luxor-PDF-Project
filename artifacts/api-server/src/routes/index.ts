import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pdfsRouter from "./pdfs";
import visitorsRouter from "./visitors";
import adminRouter from "./admin";
import licenseRouter from "./license";
import usageRouter from "./usage";
import billingRouter from "./billing";
import downloadsRouter from "./downloads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pdfsRouter);
router.use(visitorsRouter);
router.use(adminRouter);
router.use(licenseRouter);
router.use(usageRouter);
router.use(billingRouter);
router.use(downloadsRouter);

export default router;
