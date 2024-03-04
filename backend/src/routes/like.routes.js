import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js";
import { getLikedPropertys, likeProperty, likeReview } from '../controllers/like.controller.js';

const likeRouter = Router();
likeRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

likeRouter.route("/toggle/v/:propertyId").post(likeProperty);
likeRouter.route("/toggle/c/:reviewId").post(likeReview);
likeRouter.route("/propertys").get(getLikedPropertys);

export default likeRouter;