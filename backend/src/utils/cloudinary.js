import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
  
cloudinary.config({ // cloudinary configuration
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

// uploading a file
export const uploadOnCloudinary = async (localFilePath) => { // async as uploading takes some time.
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary.
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"});
        // file has been successfully uploaded.
        
        // Remove the locally saved temporary file. i.e. from the public folder
        fs.unlinkSync(localFilePath);

        return response;
    } 
    catch (error) {
      // Remove the locally saved temporary file as upload failed.
      fs.unlinkSync(localFilePath);
      return null;
    }
};

// deleting image file
export const deleteOnCloudinary = async (oldFilePublicId) => {
    try {
        if(!oldFilePublicId) return null;
        // delete the file on cloudinary.
        const response = await cloudinary.uploader.destroy(oldFilePublicId, {"resource_type": "image"});
        return response;
    } 
    catch (error) {
        return null;
    }
};

// deleting video file
export const deleteOnCloudinaryVideo = async (oldFilePublicId) => {
    try {
        if(!oldFilePublicId) return null;
        // delete the file on cloudinary.
        const response = await cloudinary.uploader.destroy(oldFilePublicId, {"resource_type": "video"});
        return response;
    } 
    catch (error) {
        return null;
    }
};