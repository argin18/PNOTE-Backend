const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userModel = require("../models/user.model");
const { sendOTPEmail, sendWelcomeEmail } = require("../services/email.service");

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (userId, role) =>
  jwt.sign({ id: userId,role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const setTokenCookie = (res, token) =>
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

// Register
const registerUser = async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    const isUserExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // store result in 'user' so we can use it below
    const user = await userModel.create({
      fullname,
      username,
      email,
      password: hash,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // send OTP email — NOT welcome email, that comes after verification
    await sendOTPEmail(user.email, otp);

    // respond AFTER email is sent
    res.status(201).json({
      message: "Registration successful. Check your email for OTP.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // send welcome email here — after OTP is verified
    await sendWelcomeEmail(user.email, user.username);

    const token = generateToken(user._id,user.role);
    setTokenCookie(res, token);

    const { password: _,otp:__, otpExpiry:___, ...safeUser } = user.toObject();
    res.status(200).json({
      message: "Email verified! Welcome aboard.",
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body

    const user = await userModel
      .findOne({ $or: [{ username }, { email }] })
      .select("+password")

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      })
    }

    // ← ban check here
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned. Contact support.",
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user._id, user.role)
    setTokenCookie(res, token)

    res.status(200).json({
      message: "Login successful!",
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error!" })
  }
}

// Logout
const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error!" });
  }
};

//store token after refresh 
const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('-password -otp -otpExpiry')

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isBanned) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      return res.status(403).json({ message: "Your account has been banned." })
    }

    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}

module.exports = {getMe, registerUser, verifyOTP, loginUser, logoutUser };