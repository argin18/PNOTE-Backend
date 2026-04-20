const express=require('express')
const {getAllReport,submitReport,updateReportStatus}=require('../controllers/report.controller')
const {authUser,authAdmin}=require('../middlewares/auth.middleware')

const router=express.Router()

router.post("/:noteId",authUser,submitReport)
router.get("/",authUser,authAdmin,getAllReport)
router.patch("/:id",authUser,authAdmin,updateReportStatus)

module.exports=router