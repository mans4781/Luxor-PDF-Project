import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pdfsRouter from "./pdfs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pdfsRouter);

export default router;
