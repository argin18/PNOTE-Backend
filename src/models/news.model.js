const mongoose = require("mongoose")

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      minLength: 5,
      maxLength: 150,
      trim: true,
      required: true,
    },
    summary: {
      type: String,
      maxLength: 300,
      trim: true,
      default: ""             // short preview for cards
    },
    content: {
      type: String,
      minLength: 20,
      maxLength: 5000,
      trim: true,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",            // Cloudinary image URL
    },
    fileUrl: {
      type: String,
      default: "",            // attached PDF if any
    },
    category: {
      type: String,
      required: true,
      enum: [
        "exam-form",
        "exam-center",
        "result",
        "routine",
        "admission",
        "academic-notice",
        "loksewa",
        "police",
        "army",
        "apf",
        "government-job",
        "scholarship",
        "bank-job",
        "ngo-job",
        "private-job",
        "other",
      ],
      default: "other",
    },
    tags: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    isPinned: {
      type: Boolean,
      default: false          // pinned news appears at top
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true          // auto-set from req.user.id in controller
    },
  },
  { timestamps: true }
)

// Fast search on title + tags
newsSchema.index({ title: "text" })   // text search on title only
newsSchema.index({ tags: 1 }) 

const newsModel = mongoose.model("News", newsSchema)
module.exports = newsModel