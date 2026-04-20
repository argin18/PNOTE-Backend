const noteModel = require("../models/note.model");
const cloudinary = require("../config/cloudinary");

//  Upload Note for only  user ─
// const uploadNote = async (req, res) => {
//   try {
//     if (!req.files || !req.files.file || !req.files.file[0]) {
//       return res.status(400).json({ message: "Note file is required" });
//     }

//     const noteFile = req.files.file[0];
//     const fileUrl = noteFile.path;
//     const fileType = noteFile.mimetype === "application/pdf" ? "pdf" : "image";

//     //  Generate Thumbnail
//     let thumbnailUrl = "";

//     if (req.files.thumbnail && req.files.thumbnail[0]) {
//       // User manually uploaded a thumbnail
//       thumbnailUrl = req.files.thumbnail[0].path;
//     } else if (fileType === "pdf") {
//       // Auto-generate thumbnail from PDF page 1
//       const result = await cloudinary.uploader.upload(fileUrl, {
//         resource_type: "image",
//         format: "jpg",
//         pages: 1,
//         transformation: [{ width: 400, height: 300, crop: "fill" }],
//         folder: "Pnote/thumbnails",
//       });
//       thumbnailUrl = result.secure_url;
//     } else {
//       // For images, use the image itself as thumbnail
//       thumbnailUrl = fileUrl.replace("/upload/", "/upload/w_400,h_300,c_fill/");
//     }

//     //  Author Photo
//     let authorPhotoUrl = "";
//     if (req.files.photo && req.files.photo[0]) {
//       authorPhotoUrl = req.files.photo[0].path;
//     }

//     //  Body Fields
//     const {
//       title,
//       description,
//       category,
//       university,
//       course,
//       semester,
//       subject,
//       authorName,
//       creditInfo,
//       tags,
//     } = req.body;

//     const tagsArray = tags
//       ? tags
//           .split(" ")
//           .map((t) => t.trim())
//           .filter(Boolean)
//       : [];

//     // Save to DB
//     const note = await noteModel.create({
//       title,
//       description,
//       category,
//       university,
//       course,
//       semester,
//       subject,
//       authorName: authorName || "",
//       authorPhoto: authorPhotoUrl,
//       creditInfo: creditInfo || "",
//       tags: tagsArray,
//       fileUrl,
//       fileType,
//       thumbnailUrl,
//       uploadedBy: req.user.id,
//       isAnonymous: !authorName && !req.files?.photo,
//     });

//     res.status(201).json({ message: "Note uploaded successfully", note });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// guest can able to upload note
const uploadNote = async (req, res) => {
  try {
    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ message: "Note file is required" });
    }

    const noteFile = req.files.file[0];
    const fileUrl = noteFile.path;
    const fileType = noteFile.mimetype === "application/pdf" ? "pdf" : "image";

    // Generate Thumbnail
    let thumbnailUrl = "";

    if (req.files.thumbnail && req.files.thumbnail[0]) {
      thumbnailUrl = req.files.thumbnail[0].path;
    } else if (fileType === "pdf") {
      const result = await cloudinary.uploader.upload(fileUrl, {
        resource_type: "image",
        format: "jpg",
        page: 1,                          // ✅ fixed: was "pages"
        transformation: [{ width: 400, height: 300, crop: "fill" }],
        folder: "Pnote/thumbnails",
      });
      thumbnailUrl = result.secure_url;
    } else {
      thumbnailUrl = fileUrl.replace(
        "/upload/",
        "/upload/w_400,h_300,c_fill/"    // ✅ fixed: no g_auto
      );
    }

    // Author Photo
    let authorPhotoUrl = "";
    if (req.files.photo && req.files.photo[0]) {
      authorPhotoUrl = req.files.photo[0].path;
    }

    // Body Fields
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
      ? tags.split(" ").map((t) => t.trim()).filter(Boolean)
      : [];

    const uploadedBy = req.user?.id || null;
    const isGuest = !uploadedBy;

    const note = await noteModel.create({
      title,
      description,
      category,
      university,
      course,
      semester,
      subject,
      authorName: authorName || (isGuest ? "Guest" : ""),
      authorPhoto: authorPhotoUrl,
      creditInfo: creditInfo || "",
      tags: tagsArray,
      fileUrl,
      fileType,
      thumbnailUrl,
      uploadedBy,
      isAnonymous: !authorName && !req.files?.photo,
    });

    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//For notes fetch
// const getAllNotes = async (req, res) => {
//   try {
//     const notes = await noteModel
//       .find({ status: "approved" })
//       .populate({
//         path: "uploadedBy",
//         match: { isBanned: false },
//         select: "username email avatar",
//       })
//       .sort({ createdAt: -1 })

//     const filtered = notes.filter(note =>
//       note.uploadedBy !== null || note.isAnonymous === true  // ← keep anonymous
//     )

//     return res.status(200).json({ message: "Notes fetched successfully", notes: filtered });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
const getAllNotes = async (req, res) => {
  try {
    const { search, category, university, course, subject } = req.query;

    const filter = { status: "approved" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
        { subject: { $regex: search, $options: "i" } },
        { course: { $regex: search, $options: "i" } },
        { university: { $regex: search, $options: "i" } }, // ← add this
        { authorName: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (university)
      filter.university = { $regex: `^${university}$`, $options: "i" };
    if (course) filter.course = { $regex: `^${course}$`, $options: "i" };
    if (subject) filter.subject = { $regex: `^${subject}$`, $options: "i" };

    const notes = await noteModel
      .find(filter)
      .populate({
        path: "uploadedBy",
        match: { isBanned: false },
        select: "username email avatar",
      })
      .sort({ createdAt: -1 });

    const filtered = notes.filter(
      (note) => note.uploadedBy !== null || note.isAnonymous === true,
    );

    return res
      .status(200)
      .json({ message: "Notes fetched successfully", notes: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// For one note fetch
const getOneNote = async (req, res) => {
  try {
    const note = await noteModel
      .findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { returnDocument: "after" },
      )
      .populate({
        path: "uploadedBy",
        match: { isBanned: false },
        select: "username email avatar",
      });

    // 404 only if: note missing, OR owner is banned AND note is NOT anonymous
    if (!note || (!note.uploadedBy && !note.isAnonymous)) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note fetched successfully", note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Note
const deleteNote = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const isOwner = note.uploadedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await noteModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Edit note — text fields only, no files
const updateNote = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

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
          .split(" ")
          .map((t) => t.trim())
          .filter(Boolean)
      : note.tags;

    const updated = await noteModel.findByIdAndUpdate(
      req.params.id,
      {
        title: title ?? note.title,
        description: description ?? note.description,
        category: category ?? note.category,
        university: university ?? note.university,
        course: course ?? note.course,
        semester: semester ?? note.semester,
        subject: subject ?? note.subject,
        authorName: authorName ?? note.authorName,
        creditInfo: creditInfo ?? note.creditInfo,
        tags: tagsArray,
        status: "pending", // ← re-queue for admin review after edit
      },
      { returnDocument: "after" },
    );

    res
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
