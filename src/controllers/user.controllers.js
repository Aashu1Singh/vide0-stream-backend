import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile } from "../utils/FileUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // user = await user.save({ validateBeforeSave: false });

    console.log(user);
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Some went wrong while gerating access and refresh tokens"
    );
  }
};
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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
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

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Email or username is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(400, "User not found with given email or username");
  }
  //  console.log(user);
  const passwordVerify = await user.isPasswordCorrect(password);

  if (!passwordVerify) {
    throw new ApiError(401, "Inalid credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshActionToken = asyncHandler(async (req, res) => {
  //ye line work krwao
  // const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  const oldRefreshToken =
    req.cookie?.refreshToken ||
    req.header("Authorization")?.replace("bearer ", "");

  // console.log(req.cookie);
  console.log(oldRefreshToken);

  if (!oldRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }

  try {
    const decodedToken = Jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (oldRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "Unauthorised user");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken,
          },
          " Action token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshActionToken };
