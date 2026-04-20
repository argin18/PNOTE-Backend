const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf";
    return {
      folder: "Pnote/news",
      resource_type: isPdf ? "raw" : "image",   // ← "raw" for PDF
      allowed_formats: isPdf ? ["pdf"] : ["jpg", "jpeg", "png", "webp"],
      ...(isPdf ? {} : {
        transformation: [
          { width: 800, height: 450, crop: "fill" },
          { quality: "auto" },
        ],
      }),
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImages = ["image/jpeg", "image/png", "image/webp"];
  const allowedAll = [...allowedImages, "application/pdf"];

  if (file.fieldname === "fileUrl") {
    // allow PDF or image for the notice attachment
    allowedAll.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Notice file must be JPEG, PNG, WEBP, or PDF"), false);
  } else {
    // thumbnail — images only
    allowedImages.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Thumbnail must be JPEG, PNG, or WEBP"), false);
  }
};

const newsUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },  // 3MB — thumbnail doesn't need 7MB
});

module.exports = newsUpload;