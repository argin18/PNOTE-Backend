const mongoose=require('mongoose')

const anonymousNoteSchema=new mongoose.Schema({
   title: {
       type: String,
       minLength: 3,
       maxLength: 30,
       trim: true,
       required: true
     },
     description: {
       type: String,
       minLength: 8,
       maxLength: 200,
       trim: true,
       required: true
     },
     fileUrl: {
       type: String,
       required: true
     },
     fileType: {
       type: String,
       enum: ["pdf", "image"],
       required: true
     },
     category: {
       type: String,
       minLength: 3,
       maxLength: 30,
       trim: true,
       required: true
     },
     status: {
       type: String,
       enum: ["pending", "approved", "flagged"],
       default: "pending"
     },
     claimedBy: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User",
       default: null
     },
     viewCount: {
       type: Number,
       default: 0
     }
   }, { timestamps: true })

   const  anonymousNoteModel= mongoose.model("AnonymousNote",anonymousNoteSchema)

   module.exports=anonymousNoteModel