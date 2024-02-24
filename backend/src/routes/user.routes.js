import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


// Creating router
const userRouter = Router();


// Route configuration
userRouter.route("/register").post(upload.single("profilePic"), registerUser);






export default userRouter;