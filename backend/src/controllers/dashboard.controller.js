import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Property } from "../models/property.models.js";
import { Purchase } from "../models/Purchase.models.js";

export const getMyPropertys = asyncHandler( async(req, res) => {

    // Getting the current user from req.user._id
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new apiError(400, "User not found.");
    }

    // Now fetching the properties where owner is the user
    const myPropertys = await Property.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $project: {
                name: 1,
                location: 1,
                price: 1,
                soldOut: 1
            }
        }
    ]);

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, myPropertys, "User propertys fetched successfully."));

} );


export const getMyPurchasedPropertys = asyncHandler( async(req, res) => {

    // Getting the current user from req.user._id
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new apiError(400, "User not found.");
    }

    // Get the propertys i bought
    const myPurchasedPropertys = await Purchase.aggregate([
        {
            $match: {
                soldTo: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "purchasedProperty"
            }
        },
        {
            $project: {
                purchasedProperty: {
                    name: 1,
                    owner: 1,
                    price: 1
                }
            }
        }
    ]);

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, myPurchasedPropertys, "User purchased propertys fetched successfully."));

} );