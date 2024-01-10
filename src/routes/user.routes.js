import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshActionToken,
  registerUser,
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
router.route("/logout").post(authenticate, logoutUser);
router.route("/refresh-token").post(refreshActionToken);

export default router;
