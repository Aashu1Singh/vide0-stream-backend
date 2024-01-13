import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshActionToken,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 2,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/refresh-token").post(refreshActionToken);
router.route("/logout").post(authenticate, logoutUser);
router.route("/change-password").post(authenticate, changeCurrentPassword);
router.route("/get-current-user").post(authenticate, getCurrentUser);
router.route("/updateUser").post(authenticate, updateAccountDetails);

export default router;
