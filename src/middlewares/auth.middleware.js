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

const authUser = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("role isBanned");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.isBanned) return res.status(403).json({ message: "Your account has been banned" });

    // Use DB user data, not JWT decoded data — role may have changed since token was issued
    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

const authAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

module.exports = { authUser, authAdmin };