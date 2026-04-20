const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true
  },
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { timestamps: true })

ratingSchema.index({ note: 1, ratedBy: 1 }, { unique: true })

const ratingModel = mongoose.model("Rating", ratingSchema)

module.exports = ratingModel