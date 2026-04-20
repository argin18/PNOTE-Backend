const commentModel = require("../models/comment.model");
const userModel = require("../models/user.model");
const noteModel = require("../models/note.model");

const submitComment = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    const note = await noteModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const comment = await commentModel.create({
      note: noteId,
      commentBy: userId,
      text,
      parentId: parentId || null,
    });
    res.status(201).json({ message: "Comment created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get comments — filter out banned users' comments
const getCommnets = async (req, res) => {
  try {
    const { noteId } = req.params;
    const comments = await commentModel
      .find({ note: noteId, parentId: null })
      .populate({
        path: "commentBy",
        match: { isBanned: false },        // ← skip banned users
        select: "username avatar",
      })

    const filtered = comments.filter(c => c.commentBy !== null)  // ← remove banned

    res.status(200).json({ message: "Comment fetched successfully", comments: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const comment = await commentModel.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.commentBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    comment.text = text;
    await comment.save();
    res.status(200).json({ message: "Comment update successfully", comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await commentModel.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.commentBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwner) return res.status(403).json({ message: "Forbidden" });

    await commentModel.deleteMany({ parentId: id });
    await commentModel.findByIdAndDelete(id);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get replies — filter out banned users' replies
const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const replies = await commentModel
      .find({ parentId: commentId })
      .populate({
        path: "commentBy",
        match: { isBanned: false },        // ← skip banned users
        select: "username avatar",
      })

    const filtered = replies.filter(r => r.commentBy !== null)  // ← remove banned

    res.status(200).json({ message: "Replies fetched successfully", replies: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getReplies, deleteComment, getCommnets, updateComment, submitComment };