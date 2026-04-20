const express=require("express")
const {getRatings,submitRating}=require('../controllers/rating.controller')
const {authUser}=require('../middlewares/auth.middleware')

const router=express.Router()

router.post("/:noteId",authUser,submitRating)
router.get("/:noteId",getRatings)

module.exports=router