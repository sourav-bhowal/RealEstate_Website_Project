import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js";
import { getMyPropertys, getMyPurchasedPropertys } from '../controllers/dashboard.controller.js';

const dashboardRouter = Router();

dashboardRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

dashboardRouter.route("/user/propertys").get(getMyPropertys);
dashboardRouter.route("/user/purchased-propertys").get(getMyPurchasedPropertys);

export default dashboardRouter;
