const mongoose = require("mongoose");

const user = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  podcasts: [
    {
      type: mongoose.Types.ObjectId,
      ref: "podcast",
    },
  ],
});

module.exports = mongoose.model("user", user);
