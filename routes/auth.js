// routes/auth.js
// POST /auth/signup, POST /auth/login, POST /auth/logout.
// Credentials only ever get forwarded to Supabase — this server never
// stores a password or hashes anything itself.

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const supabase = require("../supabaseClient");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function isMissingCredentials(email, password) {
  return (
    !email ||
    !password ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password.trim() === ""
  );
}

// ---------------------------------------------------------------------------
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (isMissingCredentials(email, password)) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ user: data.user });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (isMissingCredentials(email, password)) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Protected: needs a valid bearer token (checked by requireAuth first).
// ---------------------------------------------------------------------------
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    // The shared `supabase` client has no session of its own — sign-out
    // needs a client that's carrying THIS request's token, so we build
    // one scoped to just this request instead of a bare token argument.
    const scopedClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } },
    });

    const { error } = await scopedClient.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
