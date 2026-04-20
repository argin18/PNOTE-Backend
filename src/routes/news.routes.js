const express = require("express");
const router = express.Router();
const {
  createNews,
  getAllNews,
  getOneNews,
  updateNews,
  deleteNews,
} = require("../controllers/news.controller");
const { authUser, authAdmin } = require("../middlewares/auth.middleware");
const newsUpload = require("../middlewares/newsUpload.middleware");

// Public routes
router.get("/", getAllNews);
router.get("/:id", getOneNews);

// Admin only routes
router.post(
  "/",
  authUser,
  authAdmin,
  newsUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "fileUrl", maxCount: 1 },
  ]),
  createNews
);

router.put(
  "/:id",
  authUser,
  authAdmin,
  newsUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "fileUrl", maxCount: 1 },
  ]),
  updateNews
);

router.delete("/:id", authUser, authAdmin, deleteNews);

module.exports = router;