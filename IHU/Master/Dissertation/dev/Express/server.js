import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { error } from "console";
import User from "./models/user.js";

dotenv.config();

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const app = express();

// Middlewares
// Serve the static files from "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Handle JSON Body Data
app.use(express.json());

// Functions
const getUserById = (id) => {
  const users = getUsers();
  return users.find((user) => user.id === parseInt(id));
};

const deleteUserById = (id) => {
  let users = getUsers();
  const userIndex = users.findIndex((user) => user.id === parseInt(id));

  if (userIndex != -1) {
    users.splice(userIndex, 1);
    fs.writeFileSync(
      path.join(__dirname, "users.json"),
      JSON.stringify(users, null, 2)
    );
    return true;
  } else {
    res.status(404).json({
      message: "User not found",
    });
    return false;
  }
};

// Routes

// Get All Users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get User
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = getUserById(id);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({
      message: "User not found",
    });
  }
});

// Create User
app.post("/users", (req, res) => {
  const users = getUsers();
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ message: "ID and Name are required" });
  }
  users.push({ id: parseInt(id), name });
  fs.writeFileSync(
    path.join(__dirname, "users.json"),
    JSON.stringify(users, null, 2)
  );
  res.status(200).json({ message: "User created", user: { id, name } });
});

// Update User
app.put("/users/:id", (req, res) => {
  const users = getUsers();
  const { id } = req.params;
  const { name } = req.body;
  const indexId = req.body.id;
  const userIndex = users.findIndex((user) => user.id === parseInt(id));

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }
  users[userIndex].name = name || users[userIndex].name;
  fs.writeFileSync(
    path.join(__dirname, "users.json"),
    JSON.stringify(users, null, 2)
  );
  res.status(200).json({ message: "User updated", user: users[userIndex] });
});

// Delete User
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const userDeleted = deleteUserById(id);
  if (userDeleted) {
    res.status(200).json({
      message: "User deleted successfully",
    });
  } else {
    res.status(404).json({
      message: "User not found.",
    });
  }
});

// Run Server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
