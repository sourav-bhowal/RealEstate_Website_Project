import dotenv from "dotenv";
import {app} from "./app.js";
import connectDB from "./db/dbconnect.js";

// Config dotenv
dotenv.config({
    path: "./.env"
});

// calling the connectDB and listening on the port
connectDB()
.then(() => {
    app.listen(process.env.PORT || 6000, () => {
        console.log(`Server is runing at : ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log("MONGO_DB Connection Failed !!", error);
})
