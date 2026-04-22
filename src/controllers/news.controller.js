const newsModel = require("../models/news.model");
const cloudinary = require("../config/cloudinary");

//  Upload News 
const createNews = async (req, res) => {
  try {
    const { title, summary, content, category, tags, status, isPinned } = req.body;

    const fileUrl = req.files?.fileUrl?.[0]?.path || "";
    const fileType = req.files?.fileUrl?.[0]?.mimetype === "application/pdf" ? "pdf" : "image";

    // ─── Thumbnail Logic ───────────────────────────────────────────────
    let thumbnail = "";

    if (req.files?.thumbnail?.[0]) {
      // User uploaded a thumbnail manually
      thumbnail = req.files.thumbnail[0].path;

    } else if (fileUrl && fileType === "pdf") {
      // Auto-generate thumbnail from PDF page 1
      const result = await cloudinary.uploader.upload(fileUrl, {
        resource_type: "image",
        format: "jpg",
        pages: 1,
        transformation: [{ width: 800, height: 450, crop: "fill" }],
        folder: "Pnote/news/thumbnails",
      });
      thumbnail = result.secure_url;

    } else if (fileUrl && fileType === "image") {
      // Use the notice image itself as thumbnail
      thumbnail = fileUrl.replace("/upload/", "/upload/w_800,h_450,c_fill/");

    } else {
      // No file at all — use default
      thumbnail = "https://res.cloudinary.com/dnv4zqjl0/image/upload/v1/Pnote/news/default_thumbnail";
    }
    // ──────────────────────────────────────────────────────────────────

    const tagsArray = tags
      ? tags.split(" ").map((t) => t.trim()).filter(Boolean)
      : [];

    const news = await newsModel.create({
      title,
      summary: summary || "",
      content,
      category,
      tags: tagsArray,
      thumbnail,
      fileUrl,
      status: status || "published",
      isPinned: isPinned === "true",
      postedBy: req.user.id,
    });

    res.status(201).json({ message: "News created successfully", news });
  } catch (error) {
   console.error("createNews error:", error.message, error.stack); // ← add this
  res.status(500).json({ message: error.message });
  }
};

//  Get All Published News 
const getAllNews = async (req, res) => {
  try {
    const { category, search, tags, page = 1, limit = 10 } = req.query;

    const filter = { status: "published" };

    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    if (tags) {
      const tagsArray = tags.split(" ").map((t) => t.trim());
      filter.tags = { $in: tagsArray };
    }

    const news = await newsModel
      .find(filter)
      .populate("postedBy", "name email")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await newsModel.countDocuments(filter);

    res.status(200).json({
      message: "News fetched successfully",
      news,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Get One News (increments viewCount) ─
const getOneNews = async (req, res) => {
  try {
    const news = await newsModel
      .findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { new:true }
      )
      .populate("postedBy", "name email");

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    res.status(200).json({ message: "News fetched successfully", news });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Update News 
const updateNews = async (req, res) => {
  try {
    const news = await newsModel.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    const { title, summary, content, category, tags, status, isPinned } = req.body;

    const updateData = {};
    if (title !== undefined)    updateData.title    = title;
    if (summary !== undefined)  updateData.summary  = summary;
    if (content !== undefined)  updateData.content  = content;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined)   updateData.status   = status;
    if (isPinned !== undefined) updateData.isPinned = isPinned === "true";

    if (tags !== undefined) {
      updateData.tags = tags
        ? tags.split(" ").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    if (req.files?.thumbnail?.[0]) {
      updateData.thumbnail = req.files.thumbnail[0].path;
    }
    if (req.files?.fileUrl?.[0]) {
      updateData.fileUrl = req.files.fileUrl[0].path;
    }

    const updated = await newsModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new:true }
    );

    res.status(200).json({ message: "News updated successfully", news: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Delete News 
const deleteNews = async (req, res) => {
  try {
    const news = await newsModel.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    await newsModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createNews, getAllNews, getOneNews, updateNews, deleteNews };