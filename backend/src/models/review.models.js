import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const reviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0,
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});


reviewSchema.plugin(mongooseAggregatePaginate);    // for aggregate queries

export const Review = mongoose.model("Review", reviewSchema);