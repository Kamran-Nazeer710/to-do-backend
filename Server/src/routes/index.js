const express = require("express");

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const todoRoutes = require("./todo.routes");

const router = express.Router();

// Health
router.use("/health", healthRoutes);

// Authentication
router.use("/api/auth", authRoutes);

// Users
router.use("/api/users", userRoutes);

// Todos
router.use("/api/todos", todoRoutes);

module.exports = router;