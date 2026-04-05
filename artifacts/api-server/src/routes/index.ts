import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pdfsRouter from "./pdfs";
import visitorsRouter from "./visitors";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pdfsRouter);
router.use(visitorsRouter);

export default router;
