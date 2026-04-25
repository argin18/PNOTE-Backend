const noteModel = require("../models/note.model");
const cloudinary = require("../config/cloudinary");
const User = require("../models/user.model"); // FIX: needed for auto-resolving authorName

//  Upload Note (guest + logged-in user)
const uploadNote = async (req, res) => {
  try {
    //  Guest upload time-window check
    const isGuest = !req.user;
    if (isGuest) {
      const deadline = new Date(process.env.GUEST_UPLOAD_DEADLINE);
      if (Date.now() > deadline) {
        return res.status(403).json({
          message:
            "Guest uploads are no longer allowed. Please create an account to upload notes.",
        });
      }
    }

    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ message: "Note file is required" });
    }

    const noteFile = req.files.file[0];
    const fileUrl = noteFile.path;
    const fileType = noteFile.mimetype === "application/pdf" ? "pdf" : "image";

    //  Thumbnail
    let thumbnailUrl = "";
    if (req.files.thumbnail && req.files.thumbnail[0]) {
      thumbnailUrl = req.files.thumbnail[0].path;
    } else if (fileType === "pdf") {
      const result = await cloudinary.uploader.upload(fileUrl, {
        resource_type: "image",
        format: "jpg",
        page: 1,
        transformation: [{ width: 400, height: 225, crop: "fill" }],
        folder: "Pnote/thumbnails",
      });
      thumbnailUrl = result.secure_url;
    } else {
      thumbnailUrl = fileUrl.replace("/upload/", "/upload/w_400,h_225,c_fill/");
    }

    //  Author Photo (for guest)
    let authorPhotoUrl = "";
    if (isGuest && req.files.photo?.[0]) {
      authorPhotoUrl = req.files.photo[0].path;
    }

    //  Body Fields
    const {
      title,
      description,
      category,
      university,
      course,
      semester,
      subject,
      authorName,
      creditInfo,
      tags,
    } = req.body;

    const tagsArray = tags
      ? tags
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const uploadedBy = req.user?.id || null;

    //  Resolve Author Name
    // let resolvedAuthorName = authorName?.trim() || "";
    // if (!resolvedAuthorName) {
    //   if (!isGuest) {
    //     const user = await User.findById(uploadedBy).select("fullname");
    //     resolvedAuthorName = user?.fullname || "";
    //   } else {
    //     resolvedAuthorName = "Guest";
    //   }
    // }
    //  Resolve Author Name
    let resolvedAuthorName = authorName?.trim() || "";
    if (!resolvedAuthorName) {
      if (!isGuest) {
        resolvedAuthorName = req.user?.fullname || ""; // ✅ from middleware
      } else {
        resolvedAuthorName = "Guest";
      }
    }

    const note = await noteModel.create({
      title,
      description,
      category,
      university,
      course,
      semester,
      subject,
      authorName: resolvedAuthorName,
      authorPhoto: authorPhotoUrl,
      creditInfo: creditInfo || "",
      tags: tagsArray,
      fileUrl,
      fileType,
      thumbnailUrl,
      uploadedBy,
      isAnonymous: isGuest, // ← fixed: true only when guest, not the broken triple condition
    });

    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Get All Approved Notes
const getAllNotes = async (req, res) => {
  try {
    const { search, category, university,semester, course, subject } = req.query;
    const filter = { status: "approved" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
        { subject: { $regex: search, $options: "i" } },
        { course: { $regex: search, $options: "i" } },
        { semester: { $regex: search, $options: "i" } },
        { university: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (university)
      filter.university = { $regex: `^${university}$`, $options: "i" };
    if (course) filter.semester = { $regex: `^${semester}$`, $options: "i" };
    if (course) filter.course = { $regex: `^${course}$`, $options: "i" };
    if (subject) filter.subject = { $regex: `^${subject}$`, $options: "i" };

    const notes = await noteModel
      .find(filter)
      .populate({
        path: "uploadedBy",
        select: "username fullname email avatar isBanned",
      })
      .sort({ createdAt: -1 });

      const filtered=notes.filter((note)=> !note.uploadedBy || !note.uploadedBy.isBanned)

       return res
      .status(200)
      .json({ message: "Notes fetched successfully", notes:filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Get One Note (increments viewCount)
const getOneNote = async (req, res) => {
  try {
    // FIX: { new: true } — Mongoose option, not { returnDocument: "after" }
    const note = await noteModel
      .findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { new: true },
      )
      .populate({
        path: "uploadedBy",
        select: "username fullname email avatar isBanned",
      });

    if (!note) return res.status(404).json({ message: "Note not found" });

    return res.status(200).json({ message: "Note fetched successfully", note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Delete Note ─
const deleteNote = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.uploadedBy?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    // Delete main file
    const publicId = note.fileUrl.split("/upload/")[1].split(".")[0];
    const resourceType = note.fileType === "pdf" ? "raw" : "image";
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    // Delete thumbnail
    if (note.thumbnailUrl) {
      const thumbPath = note.thumbnailUrl.split("/upload/")[1];
      const thumbId = thumbPath.replace(/^[^/]*\/v\d+\//, "").split(".")[0];
      await cloudinary.uploader.destroy(thumbId, { resource_type: "image" });
    }

    await noteModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Update Note (text fields only, re-queues for admin review) ─
const updateNote = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.uploadedBy?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    const {
      title,
      description,
      category,
      university,
      course,
      semester,
      subject,
      authorName,
      creditInfo,
      tags,
    } = req.body;

    const tagsArray = tags
      ? tags
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : note.tags;

    const updated = await noteModel.findByIdAndUpdate(
      req.params.id,
      {
        title: title?.trim() || note.title,
        description: description?.trim() || note.description,
        category: category?.trim() || note.category,
        university: university?.trim() || note.university,
        course: course?.trim() || note.course,
        semester: semester?.trim() || note.semester,
        subject: subject?.trim() || note.subject,
        authorName: authorName?.trim() || note.authorName,
        creditInfo: creditInfo?.trim() ?? note.creditInfo,
        tags: tagsArray,
      },
      { new: true },
    );

    return res
      .status(200)
      .json({ message: "Note updated successfully", note: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  uploadNote,
  getAllNotes,
  getOneNote,
  deleteNote,
  updateNote,
};
