let router = require("express").Router();
const categoryModel = require("../models/category");

router.post("/add-category", async (req, res) => {
  try {
    let { category } = req.body;

    let categoryS = new categoryModel({ categoryName: category });
    await categoryS.save();
    return res.status(200).json({ message: "Category added Successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
});
module.exports = router;
