import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// function for mongodb server connection using try-catch
const connectDB = async () => {
    try {
        const connectedDB = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMONGO_DB Connected !! DB HOST: ${connectedDB.connection.host}`);
    } 
    catch (error) {
        console.log("\nMONGO_DB Connection ERROR.\n", error); 
        process.exit(1);  
    }
};

export default connectDB;