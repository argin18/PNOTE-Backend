const jwt = require("jsonwebtoken");
const userModel=require("../models/user.model")

const JWT_SECRET = process.env.JWT_SECRET;

// const authUser = async (req, res, next) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);

//     const  user=await userModel.findById(decoded.id).select("role isBanned")
//     if(!user) return res.status(401).json({message:"Unauthorized"})
//     if(user.isBanned) return res.status(403).json({message:"Your account has been banned"})
      
//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: "Unauthorized" });
//   }
// };

// const authUser = async (req, res, next) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);

//     const user = await userModel.findById(decoded.id).select("role isBanned");
//     if (!user) return res.status(401).json({ message: "Unauthorized" });
//     if (user.isBanned) return res.status(403).json({ message: "Your account has been banned" });

//     // Use DB user data, not JWT decoded data — role may have changed since token was issued
//     req.user = { ...decoded, role: user.role };
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: "Unauthorized" });
//   }
// };

const authUser = async (req, res, next) => {
  // Support both cookie and Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support both _id and id in JWT payload
    const userId = decoded._id || decoded.id;

    const user = await userModel.findById(userId).select("role isBanned");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.isBanned) return res.status(403).json({ message: "Your account has been banned" });

    req.user = { id: userId, role: user.role };
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

const optionalAuth = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) return next(); // guest — skip silently

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded._id || decoded.id;

    const user = await userModel.findById(userId).select("role isBanned fullname");
    if (user && !user.isBanned) {
      req.user = { id: userId, role: user.role,fullname:user.fullname };
    }
  } catch {
    // invalid token — treat as guest
  }
  next();
};

const authAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

module.exports = { authUser, authAdmin,optionalAuth };