const express = require("express");

const healthRoutes = require("./health.routes");

const router = express.Router();

// Health Routes
router.use("/health", healthRoutes);

module.exports = router;