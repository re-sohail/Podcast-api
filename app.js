const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
require("./connection/connection");
const userRoutes = require("./Routes/user");
const categoryRoutes = require("./Routes/category");
const podcastRoutes = require("./Routes/podcast");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "middleware/uploads")));

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use("/", userRoutes);
app.use("/", categoryRoutes);
app.use("/", podcastRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running at PORT: ${process.env.PORT}`);
});
