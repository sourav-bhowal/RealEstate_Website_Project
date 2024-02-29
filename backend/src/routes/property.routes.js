import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllPropertys, getPropertyById, postProperty, updatePropertyDetails, deleteProperty } from "../controllers/property.controller.js";


// Creating router
const propertyRouter = Router();


// Route configuration
propertyRouter.use(verifyJWT);  // Apply verifyJWT middleware to all routes

propertyRouter
    .route("/")
    .get(getAllPropertys)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "pictures",
                maxCount: 5,
            }
        ]),
        postProperty
    );

propertyRouter
    .route("/:propertyId")
    .get(getPropertyById)
    .patch(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "pictures",
                maxCount: 5,
            }
        ]),
        updatePropertyDetails
    )
    .delete(deleteProperty);

export default propertyRouter;