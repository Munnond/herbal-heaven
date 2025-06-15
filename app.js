require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with our custom manager
const socketManager = require('./socket/socketManager');
socketManager.init(server);

// Make socket.io instance accessible to our routes
app.set("io", socketManager.getIO());

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const blogRoutes = require("./routes/blogRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes - Place these before static file serving
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB!");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Serve frontend for non-API routes
app.get("*", (req, res, next) => {
  // Skip this middleware for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
