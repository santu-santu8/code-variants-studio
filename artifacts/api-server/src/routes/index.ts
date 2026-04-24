import { Router, type IRouter } from "express";
import healthRouter from "./health";
import variantsRouter from "./variants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(variantsRouter);

export default router;
