const jwt = require("jsonwebtoken");
const user = require("../models/user");

const authUser = async (req, res, next) => {
  const token = req.cookies.podcasterUserToken;
  try {
    if (token) {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const userVerify = await user.findOne({ _id: decode.id });
      if (!userVerify) {
        return res.status(404).json({ message: "User not found" });
      }
      req.user = userVerify;
      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Invalid Token" });
  }
};

module.exports = authUser;
