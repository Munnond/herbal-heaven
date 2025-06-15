const jwt = require("jsonwebtoken");
const { User } = require("../models/Project");

// Authentication middleware
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Token is invalid" });
    }

    // Check if user is active
    if (user.status === "inactive") {
      return res.status(401).json({ message: "Account is inactive" });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is invalid" });
  }
};

// Admin authorization middleware
exports.adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking admin privileges" });
  }
}; 