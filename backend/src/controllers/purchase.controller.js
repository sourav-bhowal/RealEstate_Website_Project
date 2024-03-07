import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import mongoose, {isValidObjectId} from "mongoose"
// import { User } from "../models/user.models.js"
import {Property} from "../models/property.models.js"
import { Purchase } from "../models/Purchase.models.js"


export const purchaseProperty = asyncHandler( async (req, res) => {

    // Take property Id from user
    const {propertyId} = req.params; 

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid Property Id.")
    }

    // Search for property in DB
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new apiError(400, "Property not found.");
    }

    if (property.owner.toString() === req.user?._id.toString()) {
        throw new apiError(400, "You are the owner of the property.");
    }

    // Check if property is already sold if not buy it
    const propertyAlreadySold = await Purchase.findOne({property: propertyId});

    if (propertyAlreadySold) {
        return res.json("Property already sold out.");
    }
    else {
        const boughtProperty = await Purchase.create({
            property: propertyId,
            soldTo: req.user?._id
        });

        // If property is bought mark it sold out
        if (boughtProperty) {
            await Property.findByIdAndUpdate(
                propertyId,
                {
                    $set: {soldOut: !property.soldOut}
                },
                {new: true}
            )
        }
    
        // Returning response
        return res
        .status(201)
        .json(new apiResponse(200, {boughtProperty}, "Property bought successfully."));    
    }

} );