import { Like } from "../models/like.models.js";
import { Property } from "../models/property.models.js";
import { Review } from "../models/review.models.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";


export const likeProperty = asyncHandler( async (req, res) => {

    // Take the inputs from the user
    const {propertyId} = req.params;

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid property Id.")
    }

    // Check for the property in DB
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new apiError(400, "Property not found.");
    }

    // Check if the property is already liked than delete it
    const propertyAlreadyLiked = await Like.findOne({
        property: propertyId,
        likedBy: req.user?._id
    });

    if (propertyAlreadyLiked) {
        await Like.findByIdAndDelete(propertyAlreadyLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200, {}, "Property disliked successfully"));
    }
    // If property is not like create a new like
    else {
        await Like.create({
            property: propertyId,
            likedBy: req.user?._id
        });
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Property liked successfully"));

} );


export const likeReview = asyncHandler( async (req, res) => {

    // Take the inputs from the user
    const {reviewId} = req.params;

    if (!isValidObjectId(reviewId)) {
        throw new apiError(400, "Invalid property Id.")
    }

    // Check for the property in DB
    const review = await Review.findById(reviewId);

    if (!review) {
        throw new apiError(400, "Review not found.");
    }

    // Check if the property is already liked than delete it
    const reviewAlreadyLiked = await Like.findOne({
        review: reviewId,
        likedBy: req.user?._id
    });

    if (reviewAlreadyLiked) {
        await Like.findByIdAndDelete(reviewAlreadyLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200, {}, "Review disliked successfully"));
    }
    // If property is not like create a new like
    else {
        await Like.create({
            review: reviewId,
            likedBy: req.user?._id
        });
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Review liked successfully"));

} );


export const getLikedPropertys = asyncHandler( async (req, res) => {

    const likedPropertys = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                property: {$exists: true}
            }
        },
        {
            $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "likedPropertys",
            }
        },
        {
            $project: {
                likedPropertys: {
                    name: 1
                }
            }
        }
        
        
        
    ]);

    if (!likedPropertys) {
        throw new apiError(404, "user has no liked propertys.");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, likedPropertys, "Liked propertys successfully fetched."));

} );