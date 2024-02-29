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
    addressLine1: {
        type: String,
        required: [true, "Property address is required."],
    },
    addressLine2: {
        type: String,
    },
    location: {
        type: String,
        required: [true, "location is required."], 
    },
    facility: {
        type: {
            bedroom: Number,
            bathroom: Number,
            area: Number,
            ambience: String,
        },
        required: [true, "facility is required."],
    },
    videoFile: {
        type: {     // cloudinary url for videofile
            url: String,
            public_id: String,
        }   
    },
    pictures: {
        type: {     // cloudinary url for picturefile
            url: String,
            public_id: String,
        },   
        required: [true, "Pictures are required."],
        }
    ,
    views: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, "Price is required"]
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    }
    
}, {timestamps: true});


propertySchema.plugin(mongooseAggregatePaginate);   // for aggregate queries

export const Property = mongoose.model('Property', propertySchema);