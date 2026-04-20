const reportModel = require("../models/report.model");
const noteModel = require("../models/note.model");

// For create report
const submitReport = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { reason } = req.body;
    const userId = req.user.id;

    const note = await noteModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() === userId)
      return res
        .status(400)
        .json({ message: "You cannot report your own note" });

    await reportModel.create({ note: noteId, reportedBy: userId, reason });
    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
  console.error(error);
  if (error.code === 11000)
    return res.status(400).json({ message: "You have already reported this note" });
  
  // Add this 👇
  if (error.name === "ValidationError")
    return res.status(400).json({ message: error.message });

  res.status(500).json({ message: "Internal error" });
}
};

// For get All reports
const getAllReport = async (req, res) => {
  try {
    const reports = await reportModel
      .find()
      .populate("reportedBy", "username")
      .populate({
        path: "note",
        select: "title uploadedBy",
        populate: {
          path: "uploadedBy",
          select: "username _id isBanned strikes role"  // ← strikes + role added
        }
      })
      .sort({ createdAt: -1 })

    res.status(200).json({ message: "Reports fetched successfully", reports })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// For update report status
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const report = await reportModel.findByIdAndUpdate(
      id,
      { status },
     { returnDocument: 'after' },
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    res.status(200).json({ message: "Successfully update report status" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getAllReport, updateReportStatus, submitReport };
