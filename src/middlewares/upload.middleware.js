const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    if (file.fieldname === "photo") {
      return {
        folder: "Pnote/author-photos",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 100, height: 100, crop: "fill" }],
      };
    }
     
    if (file.fieldname=== "thumbnail"){
      return {
         folder: "Pnote/thumbnails",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 225, crop: "fill" }],
      }
    }

    if (file.mimetype === "application/pdf") {
      return {
        folder: "Pnote/notes",
        resource_type: "raw",  // ← "image" not "raw"
        // resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
        allowed_formats: ["pdf"],
        format: "pdf",
      };
    }

    return {
      folder: "Pnote/notes",
      resource_type: "image",
      // resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "photo") {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    return allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Author photo must be JPEG, PNG, or WEBP"), false);
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  return allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only images and PDFs are allowed for notes"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;