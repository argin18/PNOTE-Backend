const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 25,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      minlength: 5,
      maxlength: 25,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    isBanned:{
      type:Boolean,
      default :false
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role:{
      type:String,
      enum:["user","admin"],
      default:"user"
    },
    avatar:{
      type:String,
      default:""
    },
    strikes: {
  type: Number,
  default: 0
},
    points:{
      type:Number,
      default:0
    },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
