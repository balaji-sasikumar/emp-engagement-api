const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./model");
const cron = require("node-cron");
const axios = require("axios");
const app = express();
const PORT = 3000;
const CONNECTION_STRING = "";
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Create (Insert JSON)
app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body); // Accept any JSON
    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read All
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Read One
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
app.put("/users/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
app.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the User API");
});

app.get("users/:phoneNumber/:password", async (req, res) => {
  const { phoneNumber, password } = req.params;
  try {
    const user = await User.find({ phoneNumber, password });
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

cron.schedule("0,30 9-17 * * *", async () => {
  try {
    const users = await User.find({});

    // Form the messages array
    const messages = users.map((user, index) => ({
      to: user.expoPushToken, // assuming the token is stored in this field
      title: "Drink Water Reminder",
      body: "It's time to drink water!",
      priority: "high",
      sound: "default",
      data: {
        messageid: String(index + 1),
        dateTime: new Date().toISOString(),
        userId: user._id.toString(), // include user ID for tracking
      },
    }));

    // Send push notifications
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Push response:", response.data);
  } catch (err) {
    console.error("Error sending push notification:", err.message);
  }
});
