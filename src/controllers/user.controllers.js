import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile } from "../utils/FileUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  
  if (existingUser) {
      throw new ApiError(409, "User with email and username already exist");
    }
    
    const avatarLocalPath = req.files?.avatar?.[0].path;
    //const coverImageLocalPath = req.files?.coverImage?.[0].path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    console.log("coverImageLocalPath ", coverImageLocalPath);
  
  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }
    
    const avatar = await uploadFile(avatarLocalPath);
    const coverImage = await uploadFile(coverImageLocalPath);
    // console.log("avatar ", avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  //    console.log();
});

export { registerUser };
