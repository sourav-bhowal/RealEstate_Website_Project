import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please enter a username"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "Please enter a username"],
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: [true, "Please enter a username"],
        lowercase: true,
        trim: true,
    },
    profilePic: {
        type: {     // cloudinary url & public_id for image
            url: String,
            public_id: String,
        },
        required: [true, "Avatar is required."]
    },
    wishList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property"
        }
    ],
    password: {
        type: String,
        required: [true, "Please enter a username"],
    },
    refreshToken: {
        type: String,
    }

}, {timestamps: true});


// Using bcrypt to encrypt the password when their is a change in the "password field". and not using arrow fn as we dont get this reference in arrow fn.
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next(); // we use "next()" to hand over the program control to the next operation
});


/* WE CAN CREATE OUR OWN METHODS IN THE SCHEMAS THAT WE HAVE DEFINED */

// using bcrypt to create a method to check wether the "password" is correct or not.
userSchema.methods.isPasswordCorrect = async function (password){   
    return await bcrypt.compare(password, this.password)
};

// WE ARE USING BOTH SESSIONS AND COOKIES //
// using jwt to generate AccessToken
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,  // left part is our variable for jwt, Right part i.e. "this" part is coming from db.
            username: this.username,
            fullName: this.fullName, 
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // expires goes inside an object
        }
    )
};

// using jwt to generate RefreshToken
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};


export const User = mongoose.model("User", userSchema);