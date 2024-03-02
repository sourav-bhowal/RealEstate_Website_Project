import mongoose from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessAndRefreshTokens } from "../middlewares/generateTokens.middleware.js";
import jwt from "jsonwebtoken";



export const registerUser = asyncHandler( async(req, res) => {
    
    // Taking the details from the user
    const { fullName, email, username, password } = req.body;

    if(fullName === "") {
        throw new apiError(400, "fullname is required.");
    }

    if(email === "") {
        throw new apiError(400, "email is required.");
    }

    const atpos = email.indexOf("@"); // check of "@" in an email for valid email
    if(atpos === -1) {
        throw new apiError(400, "email is invalid.");
    }
    
    if(username === "") {
        throw new apiError(400, "username is required.");
    }

    if(password === "") {
        throw new apiError(400, "password is required.");
    }

    if (password.length < 8) {
        throw new apiError(400, "password should be minimum of 8 characters.");
    }

    // Checking in the DB for matching email & username
    const existedUser = await User.findOne({  
        $or: [{ email }, { username }] // "$or" operator is used to take an array of checking fields
    });

    if(existedUser) {
        throw new apiError(400, "User already exists. Try different email and username.");
    }

    // Taking the profile pic from the local path
    const profilePicLocalPath = req.file?.path;

    if(!profilePicLocalPath){
        throw new apiError(400, "Profile picture is required.");
    }

    // Uploading the profile pic on cloudinary
    const profilePic = await uploadOnCloudinary(profilePicLocalPath);

    if(!profilePic){
        throw new apiError(400, "Error while uploading profile pic on cloudinary.");
    }

    // Saving the data of the USER on the DB
    const user = await User.create({
        fullName,
        email,
        password,
        profilePic: {url: profilePic.url, public_id: profilePic.public_id},
        username: username.toLowerCase()
    });

    // Check for newly created user
    const createdUser = await User.findById(user._id).select("-password -refreshToken -profilePic._id");

    if(!createdUser){
        await deleteOnCloudinary(profilePic.public_id);
        throw new apiError(500, "User registration error.");  
    }

    // Returning the Response
    return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered successfully"))

} );


export const loginUser = asyncHandler( async(req, res) => {

    // Taking data from the user
    const { email, username, password } = req.body;

    if(!(username || email)) {
        throw new apiError(400, "username or email is required.")
    }

    // Checking in the DB either for matching email or username
    const user = await User.findOne({    
        $or: [{ email }, { username }]
    });

    if(!user) {
        throw new apiError(400, "User not found");
    }

    // Checking for valid password
    const isPasswordValid = await user.isPasswordCorrect(password); 

    if(!isPasswordValid) {
        throw new apiError(400, "Password is not correct");
    }

    // Generate access token & refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // taking the user from DB
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -profilePic._id");
    
    // Declaring few options
    const options = {
        httpOnly: true,
        secure: true,
    }

    // Returning the response with options & cookies
    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(200,{user: loggedInUser, accessToken, refreshToken},"User logged in successfully."))

} );


export const logoutUser = asyncHandler( async(req, res) => {

    // Finding the user from DB using _id and updating it 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 } // this removes the field from the document
        },
        {new: true}
    )

    // Declaring few options
    const options = {
        httpOnly: true,
        secure: true,
    }

    // Returning the response with options & Clearcookies
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully."))

} );


export const refreshAccessToken = asyncHandler( async(req, res) => {

    // Getting the "incoming refresh token" from the user as we also have a refresh token
    const incomingRefreshTokenFromUser = req.cookies.refreshToken || req.body.refreshToken;

    if (! incomingRefreshTokenFromUser) {
        throw new apiError(401, "Unauthorized request.");
    }

    try {
        // Verifying the "incoming refresh token" from the user with the "refresh token" we had on the server using jwt
        const decodedToken = jwt.verify(incomingRefreshTokenFromUser, process.env.REFRESH_TOKEN_SECRET);
        
        // Taking the user from DB using the decodedToken
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new apiError(401, "Invalid refresh token.");
        }
    
        // Matching the "incoming refresh token" from the user and the "refresh token" of the user we have in DB
        if (incomingRefreshTokenFromUser !== user?.refreshToken) {
            throw new apiError(401, "Refresh Token is expired or used.");
        }
    
        // Creating options
        const options = {   
            httpOnly: true,
            secure: true
        }
    
        // Getting the new tokens from the our function
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        // Returning response
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new apiResponse(200, {accessToken, refreshToken: newRefreshToken},"Access Token refreshed successfully."))
    } 
    catch (error) {
        throw new apiError(401, error?.message, "Invalid refresh token");
    }

} );


export const getCurrentUser = asyncHandler( async(req, res) => {

    // Returning the current user
    return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully."));
} );


export const changeCurrentUserPassword = asyncHandler( async(req, res) => {
    
    // Taking the old and new password from the user using req.body
    const { oldPassword, newPassword } = req.body;

    // Finding the user in DB from req.body as user is already logged in if he had to change his password
    const user = await User.findById(req.user?._id);

    // Checking wheather the old_password is correct or not
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isOldPasswordCorrect) {
        throw new apiError(401, "Invalid old password");
    }

    // Assigning the new password to the user
    user.password = newPassword;

    // Saving the user to DB with updated password
    await user.save({validationBeforeSave: false});

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully."))

} );


export const updateUserDetails = asyncHandler( async(req, res) => {

    // Taking the input from user he/she wants to update or change from "req.body"
    const { fullName, email } = req.body;

    if(!(fullName || email)) {
        throw new apiError(400, "All fields are required.");
    }

    if (email) {
        const atpos = email.indexOf("@"); // check of "@" in an email for valid email
        if(atpos === -1) {
            throw new apiError(400, "email is invalid.");
    }
    }

    // Finding the user from DB & updating it
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {fullName, email} // you can write like this also
        },
        {new: true}
    ).select("-password")


    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "User updated successfully."));

} );


export const updateUserProfilePic = asyncHandler( async(req, res) => {

    // Taking the new file
    const newProfilePicLocalPath = req.file?.path;

    if (!newProfilePicLocalPath) {
        throw new apiError(404, "Profile pic file not found.");
    }

    // Uploading new avatar on cloudinary
    const newProfilePic = await uploadOnCloudinary(newProfilePicLocalPath);

    if(!newProfilePic) {
        throw new apiError(404, "Avatar file not found");
    }

    // Storing old avatar public_id from DB in a variable
    const oldProfilePicPublicId = req.user?.profilePic.public_id;

    // Finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {profilePic: {url: newProfilePic.url, public_id: newProfilePic.public_id}}
        },
        {new: true}
    ).select("-password -profilePic._id");

    if (!user) {
        await deleteOnCloudinary(newProfilePic.public_id);
        throw new apiError(404, "Error while updating profile picture.");
    }
    
    // Deleting old avatar on cloudinary
    const oldProfilePicDeleted = await deleteOnCloudinary(oldProfilePicPublicId);
    
    if(!oldProfilePicDeleted) {
        throw new apiError(404, "Old profile pic not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user, "Profile pic updated successfully."));

} );


export const deleteUser = asyncHandler( async(req, res) => {
    
    // Finding the user from DB
    const user = await User.findById(
        req.user?._id
    )

    // After finding the user delete the user from DB and its profilePic from cloudinary
    if (user) {
        await User.findByIdAndDelete(user._id);
        await deleteOnCloudinary(user.profilePic.public_id);
    }
    else {
        throw new apiError(404, "User not found");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Account deleted successfully."))
} );


export const getUserProfile = asyncHandler( async(req, res) => {

    // Take the username from the user
    const { username } = req.params;

    if(!username?.trim()) {
        throw new apiError(400, "Username is missing.");
    }

    // Pipeline the user profile
    const userProfile = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "propertys",
                localField: "_id",
                foreignField: "owner",
                as: "user_propertys"
            }
        },
        {
            $lookup: {
                from: "purchases",
                localField: "_id",
                foreignField: "soldBy",
                as: "user_sold_propertys"
            }
        },
        {
            $addFields: {
                userPropertyCount: {
                    $size: "$user_propertys"
                },
                userPropertySoldCount: {
                    $size: "$user_sold_propertys"
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                userPropertyCount: 1,
                userPropertySoldCount: 1,
                profilePic: 1,
                email: 1
            }
        }
    ]);

    if (!userProfile?.length) {
        throw new apiError(404, "User profile not found")
    }

    // Returning the response
    return res
    .status(200)
    .json(new apiResponse(200, userProfile[0], "User profile fetched successfully."));

} );


export const getWishlist = asyncHandler( async(req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id), // we need to manually create Mongoose object_id as in aggregate pipeline we directly connect with MongoDB whereas in only condition we connect througn Mongoose
            }
        },
        {
            $lookup: {
                from: "properties",
                localField: "wishList",
                foreignField: "_id",
                as: "wishList",
                pipeline: [ // nested or sub pipeline we r inside videos
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [ // nested or sub pipeline we r inside owner
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        profilePic: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {   // as we will get an "owner array" after "lookup" from the above pipeline it is hard for frontend engg. So we created a pipeline addFields "owner" that contain the data of the 1st owner and we can easily take the data out.
                            owner: {
                                $first: "$owner"    // "$owner" as owner is a field now
                            }
                        }
                    }
                ]
            }
        }
    ]);

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, user[0].wishList, "wishlist fetched successfully." ));
   
} );