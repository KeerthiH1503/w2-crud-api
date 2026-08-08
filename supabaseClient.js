// supabaseClient.js
// One shared Supabase client, built from environment variables.
// SUPABASE_KEY here must be the anon (public) key — never the
// service_role key, which bypasses all security and must stay secret.

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY. Copy .env.example to .env and fill in your Supabase project's values."
  );
}

// supabase-js always spins up a realtime client, which needs a native
// WebSocket implementation (Node 22+). On older Node versions there's
// no global WebSocket, so we hand it the `ws` package instead — we
// don't use realtime features here, but the client still needs this to
// construct successfully. See:
// https://github.com/orgs/supabase/discussions/45715
const wsOption = typeof globalThis.WebSocket === "undefined" ? { transport: require("ws") } : undefined;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: wsOption,
});

// A request-scoped client carrying a specific user's token in its
// headers — used by /auth/logout so signOut() ends THAT session
// rather than acting on the shared client (which has none).
function createScopedClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    realtime: wsOption,
  });
}

module.exports = supabase;
module.exports.createScopedClient = createScopedClient;
