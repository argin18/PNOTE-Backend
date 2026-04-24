const bcrypt = require('bcryptjs')
const cloudinary = require('../config/cloudinary')
const userModel = require('../models/user.model')
const noteModel = require('../models/note.model')
const playlistModel = require('../models/playlist.model')

// Update avatar
const updateAvatar = async (req, res) => {
  try {
    console.log("file:", req.file)        // ← add this
    console.log("user:", req.user)        // ← add this
    if (!req.file) return res.status(400).json({ message: "No image provided" })

    const avatarUrl = req.file.path
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    ).select('-password -otp -otpExpiry')

    res.status(200).json({ message: "Avatar updated successfully", avatar: avatarUrl, user })
  } catch (error) {
    console.error("updateAvatar error:", error)   // ← and this
    res.status(500).json({ message: error.message || "Internal server error" })
  }
}

// Public profile — return 403 if user is banned
const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params
    const user = await userModel.findOne({ username }).select("username fullname avatar points createdAt isBanned")

    if (!user) return res.status(404).json({ message: "User not found" })

    // banned user's profile is not accessible
    if (user.isBanned) return res.status(403).json({ message: "This account has been suspended." })

    const notes = await noteModel
      .find({ uploadedBy: user._id, status: "approved" }).populate("uploadedBy", "avatar fullname username")
      .sort({ createdAt: -1 })

       const playlists = await playlistModel
      .find({ owner: user._id })
      .populate("notes", "title category thumbnailUrl")
      .sort({ createdAt: -1 })
    res.status(200).json({ message: "Profile fetched successfully", user, notes,playlists })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// My notes — only own notes, all statuses
const getMyNotes = async (req, res) => {
  try {
    const id = req.user.id
    const notes = await noteModel.find({ uploadedBy: id }).populate("uploadedBy", "avatar fullname username").sort({ createdAt: -1 })
    res.status(200).json({ message: "Notes fetched successfully", notes })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// My playlists
const getMyPlaylists = async (req, res) => {
  try {
    const id = req.user.id;
    const playlists = await playlistModel
      .find({ owner: id })
      .populate("notes", "title category thumbnailUrl") // ← add thumbnailUrl
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Playlists fetched successfully", playlists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { fullname, username } = req.body

    const existing = await userModel.findOne({ username })
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(409).json({ message: "Username already taken" })
    }

    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { fullname, username },
      { returnDocument: 'after' }
    ).select('-password -otp -otpExpiry')

    res.status(200).json({ message: "Profile updated successfully", user })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await userModel.findById(req.user.id).select('+password')
    if (!user) return res.status(404).json({ message: "User not found" })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

module.exports = { getPublicProfile, getMyNotes, getMyPlaylists, updatePassword, updateProfile,updateAvatar }