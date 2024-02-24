import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});


export const Like = mongoose.model("Like", likeSchema);