import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addReview, deleteReview, getPropertyReviews, updateReview } from "../controllers/review.controller.js";


const reviewRouter = Router();

reviewRouter.use(verifyJWT);

reviewRouter.route("/:propertyId").post(addReview).get(getPropertyReviews);
reviewRouter.route("/r/:reviewId").delete(deleteReview).patch(updateReview);

export default reviewRouter;