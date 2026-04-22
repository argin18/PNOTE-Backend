const express = require('express')
const {
  deletePlaylist,
  addNoteToPlaylist,
  createPlaylist,
  removeNoteFromPlaylist,
  getPlaylistById        // ← already imported, just needed in routes
} = require('../controllers/playlist.controller')
const { authUser,optionalAuth } = require('../middlewares/auth.middleware')

const router = express.Router()

router.post("/", authUser, createPlaylist)
router.get("/:id",optionalAuth, getPlaylistById)           // ← ADD THIS
router.post("/:id/notes", authUser, addNoteToPlaylist)
router.delete("/:id/notes/:noteId", authUser, removeNoteFromPlaylist)
router.delete("/:id", authUser, deletePlaylist)

module.exports = router