const express = require("express");
const {
  deleteComment,
  getCommnets,
  submitComment,
  updateComment,getReplies,
} = require("../controllers/comment.controller");
const { authUser } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/:noteId", authUser, submitComment);
router.get("/:noteId", getCommnets);
router.get("/:commentId/replies", getReplies);
router.put("/:id", authUser, updateComment);
router.delete("/:id", authUser, deleteComment);

module.exports = router;
