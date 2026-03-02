import { getServerSupabaseClient } from "./supabase/server";

export async function createVolunteer({ email, emailSignup }) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { error } = await supabase.from("volunteers").insert({
    email,
    email_signup: Boolean(emailSignup)
  });

  if (error) {
    throw new Error(error.message);
  }
}
