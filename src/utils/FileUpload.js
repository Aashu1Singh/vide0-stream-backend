import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.v2.uploader.upload(localFilePath, {
        resourse_type: "auto"
    });
    console.log("file uploaded successfully ", response.url)

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved file
    return null;
  }
};

export { uploadFile };
