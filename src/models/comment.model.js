const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    commentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxLength: 300,
      trim: true,
    },
    parentId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Comment",
      default:null
    }
  },
  { timestamps: true },
);

const commentModel = mongoose.model("Comment", commentSchema);
module.exports = commentModel;