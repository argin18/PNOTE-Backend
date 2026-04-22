const ratingModel = require("../models/rating.model");
const noteModel = require("../models/note.model");
const userModel = require("../models/user.model");

// Submit or update rating
const submitRating = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { score } = req.body;
    const userId = req.user.id;

    const note = await noteModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() === userId)
      return res.status(403).json({ message: "You cannot rate your own note" });

    const existingRating = await ratingModel.findOne({
      note: noteId,
      ratedBy: userId,
    });

    if (existingRating) {
      existingRating.score = score;
      await existingRating.save();
    } else {
      await ratingModel.create({ note: noteId, ratedBy: userId, score });
      await userModel.findByIdAndUpdate(note.uploadedBy, {
        $inc: { points: score },
      });
    }

    res.status(200).json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all ratings for a note
const getRatings = async (req, res) => {
  try {
    const { noteId } = req.params;
    const ratings = await ratingModel.find({ note: noteId });

    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

    res.status(200).json({
      message: "Ratings fetched successfully",
      ratings,
      average: average.toFixed(1),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { submitRating, getRatings };
