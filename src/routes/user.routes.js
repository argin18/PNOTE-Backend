const express = require('express')
const { getMyNotes, getMyPlaylists, getPublicProfile, updatePassword, updateProfile, updateAvatar } = require('../controllers/user.controller')
const { authUser } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const router = express.Router()

router.put("/me/avatar", authUser, upload.single("avatar"), updateAvatar)  // ← fixed
router.get("/me/notes", authUser, getMyNotes)
router.get("/me/playlists", authUser, getMyPlaylists)
router.get("/:username", getPublicProfile)
router.put("/me", authUser, updateProfile)
router.put("/me/password", authUser, updatePassword)

module.exports = router