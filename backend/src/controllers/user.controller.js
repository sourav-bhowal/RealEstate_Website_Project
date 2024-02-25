import {asyncHandler} from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessAndRefreshTokens } from "../middlewares/generateTokens.middleware.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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
        throw new apiError(500, "User registration error.");
    }

    // Returning the Response
    return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered successfully"))

} );