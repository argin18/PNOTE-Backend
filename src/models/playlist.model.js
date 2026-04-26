const mongoose = require('mongoose')

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note"
  }]
}, { timestamps: true })

const playlistModel = mongoose.model("Playlist", playlistSchema)

module.exports = playlistModel