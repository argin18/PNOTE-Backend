const noteModel = require('../models/note.model')
const userModel = require('../models/user.model')
const reportModel = require('../models/report.model')


// Get ALL notes for admin (all statuses)
const getAdminNotes = async (req, res) => {
  try {
    const notes = await noteModel
      .find()                                      // ← no status filter
      .populate("uploadedBy", "username email")
      .sort({ createdAt: -1 })
    res.status(200).json({ message: "Notes fetched successfully", notes })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Stats for dashboard
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalNotes, pendingNotes, pendingReports] = await Promise.all([
      userModel.countDocuments(),
      noteModel.countDocuments(),
      noteModel.countDocuments({ status: "pending" }),
      reportModel.countDocuments({ status: "pending" }),
    ])
    res.status(200).json({ totalUsers, totalNotes, pendingNotes, pendingReports })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// For pending notes
const getPendingNotes = async (req, res) => {
  try {
    const notes = await noteModel.find({ status: "pending" })
      .populate("uploadedBy", "username email")
      .sort({ createdAt: -1 })
    res.status(200).json({ message: "Pending Notes fetched successfully", notes })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server Error" })
  }
}

// Update note status
const updateNoteStatus = async (req, res) => {
  try {
    const id = req.params.id
    const { status } = req.body

    if (!["approved", "flagged", "pending"].includes(status)) {  // ← add pending
      return res.status(400).json({ message: "Invalid status. Use approved, pending or flagged" })
    }

    const note = await noteModel.findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
    if (!note) return res.status(404).json({ message: "Note not found" })

    if (status === "approved") {
      await userModel.findByIdAndUpdate(note.uploadedBy, { $inc: { points: 10 } })
    }

    res.status(200).json({ message: `Note ${status}`, note })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete note
const deleteNote = async (req, res) => {
  try {
    const id = req.params.id
    const note = await noteModel.findByIdAndDelete(id)
    if (!note) return res.status(404).json({ message: "Note not found" })
    await reportModel.deleteMany({ note: id })
    res.status(200).json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find()
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 })
    res.status(200).json({ message: "Users fetched successfully", users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

const issueStrike = async (req, res) => {
  try {
    const { noteId } = req.body  // ← pass noteId from frontend

    const user = await userModel.findById(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.role === 'admin') return res.status(403).json({ message: "Cannot strike an admin" })

    user.strikes += 1
    if (user.strikes >= 3) user.isBanned = true
    await user.save()

    // hide the reported note
    if (noteId) {
      await noteModel.findByIdAndUpdate(noteId, { status: 'flagged' })
    }

    res.status(200).json({
      message: user.isBanned
        ? `User banned after 3 strikes. Note hidden.`
        : `Strike ${user.strikes}/3 issued. Note hidden.`,
      strikes: user.strikes,
      isBanned: user.isBanned
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}


// Ban toggle
const toggleBanUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.role === "admin") return res.status(403).json({ message: "Cannot ban an admin" })
    user.isBanned = !user.isBanned
    await user.save()
    res.json({ message: `User ${user.isBanned ? "banned" : "unbanned"}`, isBanned: user.isBanned })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

module.exports = { getStats, getAllUsers, getPendingNotes, deleteNote, updateNoteStatus, toggleBanUser,issueStrike,getAdminNotes }