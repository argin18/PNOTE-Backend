const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const noteRoutes=require('./routes/note.routes')
const authRoutes = require("./routes/auth.routes");
const newsRoutes=require('./routes/news.routes')
const ratingRoutes=require('./routes/rating.routes')
const commentRoutes=require('./routes/comment.routes')
const reportRoutes=require('./routes/report.routes')
const userRoutes=require('./routes/user.routes')
const playlistRoutes=require('./routes/playlist.routes')
const adminRoutes=require('./routes/admin.routes')

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes",noteRoutes)
app.use("/api/news",newsRoutes)
app.use("/api/ratings",ratingRoutes)
app.use("/api/comments",commentRoutes)
app.use("/api/reports",reportRoutes)
app.use("/api/users",userRoutes)
app.use("/api/playlists",playlistRoutes)
app.use("/api/admin",adminRoutes)

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

module.exports = app;
