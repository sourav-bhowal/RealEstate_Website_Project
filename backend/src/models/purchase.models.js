import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    property: {
        type: mongoose.Types.ObjectId,
        ref: "Property"
    },
    soldTo: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true});

export const Purchase = mongoose.model('Purchase', purchaseSchema);