const express = require("express");
const {getMe,loginUser,logoutUser,registerUser,verifyOTP,forgotPassword,resetPassword} = require("../controllers/auth.controllers");
const { authUser } = require("../middlewares/auth.middleware");
const {
  validationLogin,
  validationRegister,
} = require("../middlewares/validation.middleware");
const router = express.Router();

// For User register and Login
router.post("/register", validationRegister,registerUser);
router.post('/verify-otp',verifyOTP)
router.post("/login", validationLogin,loginUser);
router.post("/logout", authUser, logoutUser);
router.get("/me",authUser,getMe)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)

module.exports = router;