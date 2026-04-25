const express = require('express')
const upload = require('../middlewares/upload.middleware')
const { getAllNotes, getOneNote, deleteNote, uploadNote,updateNote } = require('../controllers/note.controller')
const { authUser,optionalAuth } = require('../middlewares/auth.middleware')
const router = express.Router()

// router.post("/upload", authUser, upload.fields([
//   { name: "file", maxCount: 1 },
//   { name: "photo", maxCount: 1 },
//   { name: "thumbnail", maxCount: 1 }
// ]), uploadNote)
router.post("/upload",optionalAuth, upload.fields([
  { name: "file", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), uploadNote)
router.get("/", getAllNotes)
router.get("/:id", getOneNote)
router.get("/my-notes", authUser, getMyNotes)
router.delete("/:id", authUser, deleteNote)
router.put('/:id',authUser,updateNote)

module.exports = router