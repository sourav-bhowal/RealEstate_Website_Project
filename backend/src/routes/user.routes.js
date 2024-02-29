import { Router } from "express";
import { changeCurrentUserPassword, deleteUser, getCurrentUser, getUserProfile, getWishlist, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserDetails, updateUserProfilePic } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Creating router
const userRouter = Router();


// Route configuration
userRouter.route("/register").post(upload.single("profilePic"), registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/change-password").patch(verifyJWT, changeCurrentUserPassword);
userRouter.route("/update-user-details").patch(verifyJWT, updateUserDetails);
userRouter.route("/update-user-profile-pic").patch(verifyJWT, upload.single("profilePic"), updateUserProfilePic); 
userRouter.route("/profile/:username").get(verifyJWT, getUserProfile);
userRouter.route("/wishlist").get(verifyJWT, getWishlist); 
userRouter.route("/delete-user").delete(verifyJWT, deleteUser); 


export default userRouter;