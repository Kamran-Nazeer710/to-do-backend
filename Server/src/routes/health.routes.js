const express = require("express");

const router = express.Router();

/**
 * @route GET /health
 * @desc Health Check
 * @access Public
 */
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running successfully 🚀",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;