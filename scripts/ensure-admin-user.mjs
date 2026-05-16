/**
 * Create or update the WikiMe admin user in Supabase Auth.
 * Usage: ADMIN_BOOTSTRAP_PASSWORD=yourpassword node scripts/ensure-admin-user.mjs
 */
import { createClient } from "@supabase/supabase-js";

const email = (process.env.ADMIN_EMAIL || "admin@sikhomode.org").trim();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!password || password.length < 6) {
  console.error("Set ADMIN_BOOTSTRAP_PASSWORD (min 6 characters).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const existing = list.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);

if (existing) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: "admin" },
    },
  );
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Updated admin user: ${data.user.email}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Created admin user: ${data.user.email}`);
}

console.log("Sign in at /login?next=/admin with this account.");
