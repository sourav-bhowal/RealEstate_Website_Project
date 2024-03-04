import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { purchaseProperty } from "../controllers/purchase.controller.js";


const purchaseRouter = Router();

purchaseRouter.use(verifyJWT);

purchaseRouter.route("/:propertyId").post(purchaseProperty)


export default purchaseRouter;