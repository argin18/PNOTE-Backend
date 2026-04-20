const express = require("express");
const {getMe,loginUser,logoutUser,registerUser,verifyOTP} = require("../controllers/auth.controllers");
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


module.exports = router;