import { Like } from "../models/like.models.js";
import { Property } from "../models/property.models.js";
import { Review } from "../models/review.models.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";


export const addReview = asyncHandler(async (req, res) => {

    // Taking the comment content & property id
    const { propertyId } = req.params;
    const { content, rating } = req.body;

    if (content === "" && rating === 0) {
        throw new apiError(400, "Content is required.");
    }

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid property id.");
    }

    // Search for property in DB
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new apiError(400, "Property not found");
    }

    // Create a new review
    const review = await Review.create({
        content,
        rating,
        property: property._id,
        owner: req.user?._id
    });

    if (!review) {
        throw new apiError(400, "Error while creating review.");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, review, "Review created successfully."));

} );


export const updateReview = asyncHandler( async (req, res) => {

    // Taking the inputs
    const { reviewId } = req.params;
    const { content, rating } = req.body;

    if (content === "" && rating === 0) {
        throw new apiError(400, "Content is required.");
    }

    if (!isValidObjectId(reviewId)) {
        throw new apiError(400, "Invalid review id.");
    }

    // Search for property in DB
    const review = await Review.findById(reviewId);

    if (!review) {
        throw new apiError(400, "Review not found");
    }

    if (review.owner.toString() === req.user?._id.toString()) {
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                $set: {content, rating}
            },
            {new: true}
        );

        // Returning response
        return res
        .status(200)
        .json(new apiResponse(200, updatedReview, "Review updated successfully."))
    }
    else {
        throw new apiError(400, "Unauthorized access to review.");
        
    }

} );


export const deleteReview = asyncHandler( async(req, res) => {

    // Taking the review id
    const {reviewId} = req.params;

    if (!isValidObjectId(reviewId)) {
        throw new apiError(400, "Invalid review id.");
    }

    // Search for review in DB
    const review = await Review.findById(reviewId);

    if (!review) {
        throw new apiError(400, "Review not found");
    }

    if (review.owner.toString() === req.user?._id.toString()) {
        const deletedReview = await Review.findByIdAndDelete(reviewId);

        // Delete the review likes
        if (deletedReview) {
            await Like.deleteMany({review: deletedReview._id});
        }
        else {
            throw new apiError(404, "Something went wrong while deleting review.")
        }  
    }
    else {
        throw new apiError(400, "Unauthorized access to review.");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Review deleted successfully."));

} );


export const getPropertyReviews = asyncHandler( async (req, res) => {

    // Taking inputs
    const {propertyId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid property id")
    }

    if(page < 1 || limit > 10) {
        throw new apiError(400, "Invalid page number or limit");
    }

    // Search for property in DB
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new apiError(400, "Video not found.");
    }

    // Get reviews of the property
    const propertyReviews = Review.aggregate([
        {
            $match: {
                property: new mongoose.Types.ObjectId(propertyId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "reviewOwner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "review",
                as: "reviewLikes"
            }
        },
        {
            $addFields: {
                reviewLikesCount: {
                    $size: "$reviewLikes"
                },
                reviewOwner: {
                    $first: "$reviewOwner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$reviewLikes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                rating: 1,
                createdAt: 1,
                reviewLikesCount: 1,
                reviewOwner: {
                    username: 1,
                    profilePic: 1
                },
                isLiked: 1
            }
        }
    ]);

    // Defining options for aggregate paginate
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    // Using the aggregate paginate
    const reviews = await Review.aggregatePaginate(
        propertyReviews,
        options
    );

    if (!reviews) {
        return res
        .status(200)
        .json(new apiResponse(200, {}, "Property has no reviews."))
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, reviews, "Property reviews fetched successfully."))
 
} );