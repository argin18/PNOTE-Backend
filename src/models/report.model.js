const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: ["spam","inappropriate", "copyright", "wrong_content", "other"],
      required:true
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

reportSchema.index({note:1,reportedBy:1},{unique:true})

const reportModel = mongoose.model("Report", reportSchema);

module.exports = reportModel;
