const express = require('express')
const { authAdmin, authUser } = require('../middlewares/auth.middleware')
const { deleteNote, getAllUsers, getPendingNotes, toggleBanUser, updateNoteStatus, getStats, issueStrike, getAdminNotes } = require('../controllers/admin.controller')
const { getAllReport, updateReportStatus } = require('../controllers/report.controller')

const router = express.Router()

// router.use(authUser, authAdmin)

// Stats
router.get("/stats", getStats)

// Notes — order matters: specific routes before param routes
router.get("/notes/pending",authUser, authAdmin, getPendingNotes)   // ← must be before /notes/:id
router.get("/notes",authUser, authAdmin, getAdminNotes)
router.put("/notes/:id",authUser, authAdmin, updateNoteStatus)
router.delete("/notes/:id",authUser, authAdmin, deleteNote)

// Reports
router.get("/reports",authUser, authAdmin, getAllReport)
router.put("/reports/:id",authUser, authAdmin, updateReportStatus)

// Users
router.get("/users",authUser, authAdmin, getAllUsers)
router.put("/users/:id/strike",authUser, authAdmin, issueStrike)
router.put("/users/:id/ban",authUser, authAdmin, toggleBanUser)

module.exports = router