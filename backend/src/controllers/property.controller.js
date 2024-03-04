import mongoose, {isValidObjectId} from "mongoose"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary, deleteOnCloudinaryVideo} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import {Property} from "../models/property.models.js"
import {Like} from "../models/like.models.js"
import {Review} from "../models/review.models.js"


export const getAllPropertys = asyncHandler( async(req, res) => {

    // Taking the inputs from the user
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

    if (page < 1 && limit > 10) {
        throw new apiError(400, "Invalid page number or limit")
    }

    if (!query && !query?.trim()) {
        throw new apiError(400, "Specify query");
    }

    // Defing search criteria
    const searchCriteria = {};
    if(sortBy && sortType) {
        searchCriteria[sortBy] = sortType === "asc" ? 1 : -1;
    }
    else {
        searchCriteria["createdAt"] = -1; 
    }

    // Defining options for aggregate paginate 
    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10),
        sort: searchCriteria
    };

    // Defining the pipeline
    const propertyAggregation = Property.aggregate([
        {
            $match: {
                $or: [
                    {name: {$regex: query}},
                    {description: {$regex: query}},
                    {location: {$regex: query}},
                ]
            }
        }
    ]);

    // Using aggregate paginate
    const propertys = await Property.aggregatePaginate(
        propertyAggregation,
        options
    )

    if (propertys.totalDocs === 0) {   // totalDocs is available as we are using aggregate paginate
        throw new apiError(400, "No propertys matched the searched query.")
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, propertys, "propertys fetched successfully."))

} );


export const postProperty = asyncHandler( async(req, res) => {
    
    // Taking the inputs from the user
    const { name, description, addressLine1, addressLine2, location, bedroom, bathroom, ambience, area, price } = req.body;

    if (name === "" && description === "" && addressLine1 === "" && addressLine2 === "" && location === "" && price === 0) {
        throw new apiError(400, "All fields are required.");
    }

    if (bedroom === 0 && bathroom === 0, ambience === "" && area === 0) {
        throw new apiError(400, "All fields are required.")
    }

    // Taking the video and images
    let videoFileLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoFileLocalPath = req.files?.videoFile[0].path;
    }

    if (!videoFileLocalPath) {
        throw new apiError(400, "Video file not found.")
    }

    let picturesFileLocalPath;
    if (req.files && Array.isArray(req.files.pictures) && req.files.pictures.length > 0) {
        picturesFileLocalPath = req.files?.pictures[0].path;
    }

    if (!picturesFileLocalPath) {
        throw new apiError(400, "Pictures file not found.")
    }

    // Uploading the video & pictures to cloudinary
    const video = await uploadOnCloudinary(videoFileLocalPath);

    if(!video){
        throw new apiError(400, "Video is required");
    }

    const pictures = await uploadOnCloudinary(picturesFileLocalPath);

    if(!pictures){
        throw new apiError(400, "Pictures is required");
    }

    // Creating a new property in the DB
    const property = await Property.create({
        name,
        description,
        addressLine1,
        addressLine2,
        location,
        facility: {bedroom, bathroom, area, ambience},
        videoFile: {url: video.url, public_id: video.public_id},
        pictures: {url: pictures.url, public_id: pictures.public_id},
        price,
        owner: req.user?._id
    });
    
    if (!property) {
        await deleteOnCloudinaryVideo(video.public_id);
        await deleteOnCloudinary(pictures.public_id);
        throw new apiError(400, "Error while creating new property.")
    }

     // Returning response
     return res
     .status(202)
     .json(new apiResponse(200, property, "Property created successfully."));
} );


export const getPropertyById = asyncHandler( async (req, res) => {
    
    // Getting property id from the user through parameter
    const { propertyId } = req.params;
    
    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid propertyId.");
    }

    // Searching for property in DB
    const searchedProperty =  await Property.findByIdAndUpdate(
        propertyId,
        {
            $inc: {views: 1},
        },
        {new: true}
    )

    if (!searchedProperty) {
        throw new apiError(400, "Property not found.");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, searchedProperty, "Property fetched successfully"));

} );


export const updatePropertyDetails = asyncHandler( async (req, res) => {

    // Getting the inputs from the user
    const { propertyId } = req.params;
    const { name, description, price } = req.body;

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid propertyId.");
    }

    if (!name || !description || !price) {
        throw new apiError(400, "Invalid name or description.");
    }

    // Taking the new video and new images
    let newVideoFileLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        newVideoFileLocalPath = req.files?.videoFile[0].path;
    }

    if (!newVideoFileLocalPath) {
        throw new apiError(400, "Video file not found.")
    }

    let newPicturesFileLocalPath;
    if (req.files && Array.isArray(req.files.pictures) && req.files.pictures.length > 0) {
        newPicturesFileLocalPath = req.files?.pictures[0].path;
    }

    if (!newPicturesFileLocalPath) {
        throw new apiError(400, "Pictures file not found.")
    }
    
    // Search for property in DB
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new apiError(400, "Property not found.");
    }

    // Storing old videoFile 
    const oldVideoFile = property?.videoFile.public_id;
    const oldPicturesFile = property?.pictures.public_id;

    // Update property details
    let updateProperty; 
    
    if (property.owner.toString() === req.user?._id.toString()) {
        const newVideoFile = await uploadOnCloudinary(newVideoFileLocalPath);
        const newPicturesFile = await uploadOnCloudinary(newPicturesFileLocalPath);
        if(!newVideoFile) {
            throw new apiError(404, "Video file not found");
        }

        if (!newPicturesFile) {
            throw new apiError(404, "Pictures file not found");
        }

        updateProperty = await Property.findByIdAndUpdate(
            property._id,
            {
                $set: {
                    name,
                    description,
                    videoFile: {url: newVideoFile.url, public_id: newVideoFile.public_id},
                    pictures: {url: newPicturesFile.url, public_id: newPicturesFile.public_id},
                    price
                }
            },
            {new: true}
        );
    }
    else {
        throw new apiError(404, "Unauthorized access.");
    }

    // Deleting old video from cloudinary
    const oldVideoDeleted = await deleteOnCloudinaryVideo(oldVideoFile);
    const oldPicturesDeleted = await deleteOnCloudinary(oldPicturesFile);

    if (!oldVideoDeleted) {
        throw new apiError(404, "Old thumbnail not deleted");
    }

    if (!oldPicturesDeleted) {
        throw new apiError(404, "Old thumbnail not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(201, updateProperty, "Video updated successfully."));

} );


// export const updatePropertyVideo = asyncHandler( async(req, res) => {

//     // Take the video and property id from the user
//     const { propertyId } = req.params;
//     const newVideoFileLocalPath = req.file?.path;

//     if (!isValidObjectId(propertyId)) {
//         throw new apiError(400, "Invalid propertyId.");
//     }

//     if (!newVideoFileLocalPath) {
//         throw new apiError(404, "Profile pic file not found.");
//     }

//     // Search for property in DB
//     const property = await Property.findById(propertyId);

//     if (!property) {
//         throw new apiError(400, "Property not found.");
//     }

//     // Storing old videoFile 
//     const oldVideoFile = property?.videoFile.public_id;

//     // Update property details
//     let updateProperty; 
    
//     if (property.owner.toString() === req.user?._id.toString()) {
//         const newVideoFile = await uploadOnCloudinary(newVideoFileLocalPath);

//         if(!newVideoFile) {
//             throw new apiError(404, "Video file not found");
//         }

//         updateProperty = await Property.findByIdAndUpdate(
//             property._id,
//             {
//                 $set: {videoFile: {url: newVideoFile.url, public_id: newVideoFile.public_id}}
//             },
//             {new: true}
//         );
//     }
//     else {
//         throw new apiError(404, "Unauthorized access.");
//     }

//     // Deleting old video from cloudinary
//     const oldVideoDeleted = await deleteOnCloudinaryVideo(oldVideoFile);
    
//     if (!oldVideoDeleted) {
//         throw new apiError(404, "Old thumbnail not deleted");
//     }

//     // Returning response
//     return res
//     .status(200)
//     .json(new apiResponse(201, updateProperty, "Video updated successfully."));
// } );


export const deleteProperty = asyncHandler( async (req, res) => {

    // Getting the inputs from the user
    const { propertyId } = req.params;

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid propertyId.");
    }

    // Searching for video in DB
    const deleteProperty = await Property.findById(propertyId);

    if (!deleteProperty) {
        throw new apiError(400, "Property not found.");
    }

    // Storing videoFile and images
    const videoFile = deleteProperty?.videoFile.public_id;
    const picturesFile = deleteProperty?.pictures.map((picturesFile) => picturesFile.public_id);
    // console.log(picturesFile)

    // If the video owner and current logged in user are same the delete the video & its assets
    if (deleteProperty.owner.toString() === req.user._id.toString()) {
        await deleteOnCloudinary(picturesFile);
        await deleteOnCloudinaryVideo(videoFile);
        const deletedProperty = await Property.findByIdAndDelete(propertyId);
        const reviews = await Review.find({property: deletedProperty._id});
        const reviewIds = reviews.map((review) => review._id);

        if (deleteProperty) {
            await Like.deleteMany({property: deletedProperty._id});
            await Like.deleteMany({review: {$in: reviewIds}});
            await Review.deleteMany({property: deletedProperty._id});
            const users = await User.find({wishList: deletedProperty._id});

            for (const user of users) {
                await User.findByIdAndUpdate(
                    user._id,
                    {
                        $pull: {wishList: deletedProperty._id}
                    },
                    {new: true}
                )
            }
        } else {
            throw new apiError(400, "Something went wrong while deleting the property")
        }
    } else {
        throw new apiError(400, "Unauthorized access.");
    }

    // Returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Property deleted successfully."));
} );


export const addPropertyToWishList = asyncHandler( async (req, res) => {

    const { propertyId } = req.params;

    if (!isValidObjectId(propertyId)) {
        throw new apiError(400, "Invalid object id.");
    }
    
    await User.findByIdAndUpdate(
        req?.user._id,
        {
          $addToSet: {wishList: propertyId}
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new apiResponse(200, {}, "property added to wishlist"))

} );
