const express = require('express')
const { authAdmin, authUser } = require('../middlewares/auth.middleware')
const { deleteNote, getAllUsers, getPendingNotes, toggleBanUser, updateNoteStatus, getStats, issueStrike, getAdminNotes } = require('../controllers/admin.controller')
const { getAllReport, updateReportStatus } = require('../controllers/report.controller')

const router = express.Router()

router.use(authUser, authAdmin)

// Stats
router.get("/stats", getStats)

// Notes — order matters: specific routes before param routes
router.get("/notes/pending", getPendingNotes)   // ← must be before /notes/:id
router.get("/notes", getAdminNotes)
router.put("/notes/:id", updateNoteStatus)
router.delete("/notes/:id", deleteNote)

// Reports
router.get("/reports", getAllReport)
router.put("/reports/:id", updateReportStatus)

// Users
router.get("/users", getAllUsers)
router.put("/users/:id/strike", issueStrike)
router.put("/users/:id/ban", toggleBanUser)

module.exports = router