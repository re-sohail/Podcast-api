const mongoose = require("mongoose");

const category = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  podcast: [
    {
      type: mongoose.Types.ObjectId,
      ref: "podcast",
    },
  ],
});

module.exports = mongoose.model("category", category);
