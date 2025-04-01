const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log("Received registration request:", req.body);

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user instance
    user = new User({ email, password, role });

    console.log("Saving user to MongoDB:", user);

    // Save to database
    await user.save();

    console.log("User saved successfully!");

    res.json({ message: "User registered successfully", user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    // Check password (for now, compare plain text; later, use bcrypt)
    if (user.password !== password) {
      console.log("Invalid password for:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({ message: "Login successful", user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
