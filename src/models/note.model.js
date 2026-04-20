const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      minLength: 5,
      maxLength: 100,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      minLength: 15,
      maxLength: 2000,
      trim: true,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      minLength: 3,
      maxLength: 30,
      trim: true,
      required: true,
    },
    university: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    course: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    semester: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      required: true,
    },
    authorName: {
      type: String,
      trim: true,
      default: "",
    },
    creditInfo: {
      type: String,
      trim: true,
      default: "",
    },
    authorPhoto: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    // uploadedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ← must be false
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "flagged"],
      default: "pending",
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const noteModel = mongoose.model("Note", notesSchema);
module.exports = noteModel;
