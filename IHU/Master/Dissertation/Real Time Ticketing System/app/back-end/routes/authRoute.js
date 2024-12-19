import express from "express";
import {
  registerAccount,
  loginAccount,
} from "../controllers/authController.js";

const router = express.Router();

// Route for user registration
router.post("/register", registerAccount);

// Route for user login
router.post("/login", loginAccount);

export default router;