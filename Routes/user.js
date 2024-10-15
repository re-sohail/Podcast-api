const router = require("express").Router();
const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authUser = require("../middleware/auth");
const nodeCache = require("node-cache");
const cache = new nodeCache();

router.post("/sign-up", async (req, res) => {
  try {
    let { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let error = [];

    if (username.length < 4) {
      error.push("username should be greater then 4");
    }
    if (password.length < 6) {
      error.push("password should be greater then 6");
    }

    if (error.length === 0) {
      let userName = await userModel.findOne({ username });
      if (userName) {
        error.push("username is already taken");
      }

      let userEmail = await userModel.findOne({ email });
      if (userEmail) {
        error.push("email is already registered");
      }
    }

    if (error.length > 0) {
      return res.status(400).json({ message: error });
    }

    const saltRound = 10;
    const hasdPassword = await bcrypt.hash(password, saltRound);

    const newUser = new userModel({
      name,
      username,
      email,
      password: hasdPassword,
    });
    await newUser.save();

    return res.status(200).json({ message: "Account Created Successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All Fields are Required" });
    }

    let verifyUser = await userModel.findOne({ email });
    if (!verifyUser) {
      return res.status(400).json({ message: "invalid credential" });
    }

    let isMatch = await bcrypt.compare(password, verifyUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid credential" });
    }

    let token = jwt.sign(
      { id: verifyUser._id, email: verifyUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("podcasterUserToken", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "Lax",
    });

    return res.status(200).json({
      id: verifyUser._id,
      username: verifyUser.username,
      email: email,
      message: "Sign In Successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

router.post("/sign-out", (req, res) => {
  try {
    res.clearCookie("podcasterUserToken", {
      httpOnly: true,
    });
    cache.flushAll();
    return res.status(200).json({ message: "Logout Successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/check-cookie", (req, res) => {
  try {
    let token = req.cookies.podcasterUserToken;
    if (token) {
      return res.status(200).json({ message: true });
    } else {
      return res.status(200).json({ message: false });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/user-details", authUser, async (req, res) => {
  try {
    let { email } = req.user;
    let userDetails = await userModel.findOne({ email }).select("-password");
    return res.status(200).json({ data: userDetails });
  } catch (error) {
    res.status(500).json({ error });
  }
});

module.exports = router;
