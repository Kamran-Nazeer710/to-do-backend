const express = require("express");

const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/profile", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "You are authenticated",
    user: req.user,
  });
});

module.exports = router;