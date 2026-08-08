// routes/misc.js
// GET /public/info (open) and GET /protected/profile, /protected/dashboard
// (guarded by requireAuth) — proving the middleware protects more than
// one route with zero duplicated auth logic.

const express = require("express");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/public/info", (req, res) => {
  res.status(200).json({ message: "Welcome stranger! This info is public." });
});

router.get("/protected/profile", requireAuth, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at,
  });
});

// A second protected route using the exact same middleware — no new
// auth code, just proving the guard is reusable (Stage 4 checkpoint).
router.get("/protected/dashboard", requireAuth, (req, res) => {
  res.status(200).json({
    message: `Welcome back, ${req.user.email}.`,
    id: req.user.id,
  });
});

module.exports = router;
