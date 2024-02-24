import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Property name is required."],
    },
    description: {
        type: String,
        required: [true, "Property description is required."],
    },
    category: {
        type: String,
    },
    addressLine1: {
        type: String,
        required: [true, "Property address is required."],
    },
    addressLine2: {
        type: String,
    },
    pinCode: {
        type: String,
        required: [true, "PinCode is required."],
    },
    location: {
        type: {
            district: String,
            state: String,
            country: String,
        },
        required: [true, "location is required."], 
    },
    videoFile: {
        type: {     // cloudinary url for videofile
            url: String,
            public_id: String,
        }   
    },
    pictures: [
        {
            type: {     // cloudinary url for picturefile
                url: String,
                public_id: String,
            },   
            required: [true, "Pictures are required."],
        }
    ],
    views: {
        type: Number,
        default: 0,
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: "Category"
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    }
    
}, {timestamps: true});


propertySchema.plugin(mongooseAggregatePaginate);   // for aggregate queries

export const Property = mongoose.model('Property', propertySchema);