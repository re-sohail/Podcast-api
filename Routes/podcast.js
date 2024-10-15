const authUser = require("../middleware/auth");
const upload = require("../middleware/multer");
const categoryModel = require("../models/category");
const podcastModel = require("../models/podcast");
const userModel = require("../models/user");
const nodeCache = require("node-cache");
const cache = new nodeCache();

let router = require("express").Router();

router.post("/add-podcast", authUser, upload, async (req, res) => {
  try {
    let { title, description, category } = req.body;
    let image = req.files["image"][0].path;
    let audio = req.files["audio"][0].path;

    if (!title || !description || !category || !image || !audio) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const { user } = req;

    const existingCategory = await categoryModel.findOne({
      categoryName: category,
    });
    if (!existingCategory) {
      return res.status(400).json({ message: "No category founds" });
    }

    const newPodcast = new podcastModel({
      title,
      description,
      category: existingCategory._id,
      image,
      audio,
      user: user._id,
    });
    await newPodcast.save();
    await categoryModel.findByIdAndUpdate(existingCategory._id, {
      $push: { podcast: newPodcast._id },
    });

    await userModel.findByIdAndUpdate(user._id, {
      $push: { podcasts: newPodcast._id },
    });
    return res.status(200).json({ message: "Podcast added successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/get-podcast", async (req, res) => {
  try {
    const cacheKey = "allPodcasts";

    if (cache.has(cacheKey)) {
      const formattedPodcasts = JSON.parse(cache.get(cacheKey));
      return res.status(200).json({ data: formattedPodcasts });
    }

    const allPodcast = await podcastModel
      .find()
      .populate({
        path: "user",
        select: "name",
      })
      .populate("category")
      .sort({ createdAt: -1 });

    const formattedPodcasts = allPodcast.map((podcast) => {
      return {
        ...podcast.toObject(),
        image: `http://localhost:1000/uploads/${podcast.image
          .split("/")
          .pop()}`,
      };
    });

    cache.set(cacheKey, JSON.stringify(formattedPodcasts), 604800);

    return res.status(200).json({ data: formattedPodcasts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
});

router.get("/get-user-podcast", authUser, async (req, res) => {
  try {
    const { user } = req;
    const cacheKey = `userPodcasts_${user._id}`;

    if (cache.has(cacheKey)) {
      const podcastData = JSON.parse(cache.get(cacheKey));
      return res.status(200).json({ data: podcastData });
    }

    const userPodcast = await userModel
      .findById(user._id)
      .populate({
        path: "podcasts",
        populate: [
          { path: "category", select: "categoryName" },
          { path: "user", select: "name" },
        ],
      })
      .select("-password");

    if (!userPodcast) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userPodcast.podcasts || userPodcast.podcasts.length === 0) {
      return res.status(200).json({ data: [] });
    }

    userPodcast.podcasts = userPodcast.podcasts
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const podcastData = userPodcast.podcasts.map((podcast) => ({
      _id: podcast._id,
      title: podcast.title,
      description: podcast.description,
      audio: podcast.audio,
      image: `${req.protocol}://${req.get("host")}/uploads/${podcast.image
        .split("/")
        .pop()}`,
      category: podcast.category,
      user: podcast.user,
    }));

    cache.set(cacheKey, JSON.stringify(podcastData), 604800);

    return res.status(200).json({ data: podcastData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
});

router.get("/get-podcast/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (cache.has(id)) {
      const formattedPodcast = JSON.parse(cache.get(id));
      return res.status(200).json({ data: formattedPodcast });
    }

    const podcastData = await podcastModel
      .findById(id)
      .populate("category")
      .populate("user");

    if (!podcastData) {
      return res.status(404).json({ message: "Podcast not found" });
    }

    const formattedPodcast = {
      ...podcastData.toObject(),
      image: `http://localhost:1000/uploads/${podcastData.image
        .split("/")
        .pop()}`,
      audio: `http://localhost:1000/uploads/${podcastData.audio
        .split("/")
        .pop()}`,
    };

    cache.set(id, JSON.stringify(formattedPodcast), 604800);

    return res.status(200).json({ data: formattedPodcast });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    if (cache.has(category)) {
      const responsePodcasts = JSON.parse(cache.get(category));
      return res.status(200).json({ data: responsePodcasts });
    }

    const categories = await categoryModel
      .find({ categoryName: category })
      .populate({
        path: "podcast",
        populate: { path: "user category" },
      });

    let podcasts = [];
    categories.forEach((cat) => {
      podcasts = [...podcasts, ...cat.podcast];
    });

    const responsePodcasts = podcasts.map((podcast) => ({
      title: podcast.title,
      description: podcast.description,
      image: `${req.protocol}://${req.get("host")}/uploads/${podcast.image
        .split("/")
        .pop()}`,
      audio: `${req.protocol}://${req.get("host")}/uploads/${podcast.audio
        .split("/")
        .pop()}`,
      user: podcast.user,
      _id: podcast._id,
      category: podcast.category,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
    }));

    cache.set(category, JSON.stringify(responsePodcasts), 604800);

    return res.status(200).json({ data: responsePodcasts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
