// middleware/requireAuth.js
// The guard. Extracts the bearer token from the Authorization header,
// verifies it with Supabase, and attaches req.user on success.
// Apply this to any route that should only answer for a logged-in user.

const supabase = require("../supabaseClient");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  // Header missing, or not in the exact "Bearer <token>" shape, or the
  // token part is empty -> we haven't even tried Supabase yet.
  if (!header || !header.startsWith("Bearer ") || header.slice(7).trim() === "") {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = header.slice(7).trim();

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Downstream routes can read req.user and, if they need it, the raw
    // token itself (logout needs to pass the token back to Supabase).
    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
