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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
