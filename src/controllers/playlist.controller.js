const playlistModel = require("../models/playlist.model");
const noteModel = require("../models/note.model");

// Create playlist
const createPlaylist = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const playlist = await playlistModel.create({ name, owner: userId }); // ← owner
    res
      .status(201)
      .json({ message: "Playlist created successfully", playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get playlist by ID with populated notes
const getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistModel.findById(id).populate("notes");
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user.id) {
      // ← owner
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json({ playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add note to playlist
const addNoteToPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { noteId } = req.body;

    // note ownership check — note model uses uploadedBy ✅
    const note = await noteModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() !== req.user.id) {
      // ← uploadedBy (note model field)
      return res
        .status(403)
        .json({ message: "You can only add your own notes to a playlist" });
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user.id) {
      // ← owner (playlist model field)
      return res.status(403).json({ message: "Forbidden" });
    }

    if (playlist.notes.includes(noteId)) {
      return res.status(400).json({ message: "Note already in playlist" });
    }

    playlist.notes.push(noteId);
    await playlist.save();

    res.status(200).json({ message: "Note added to playlist", playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove note from playlist
const removeNoteFromPlaylist = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const playlist = await playlistModel.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user.id) {
      // ← owner
      return res.status(403).json({ message: "Forbidden" });
    }

    playlist.notes = playlist.notes.filter((n) => n.toString() !== noteId);
    await playlist.save();

    res.status(200).json({ message: "Note removed from playlist", playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete playlist
const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistModel.findById(id);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user.id) {
      // ← owner
      return res.status(403).json({ message: "Forbidden" });
    }

    await playlistModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createPlaylist,
  getPlaylistById,
  addNoteToPlaylist,
  removeNoteFromPlaylist,
  deletePlaylist,
};
