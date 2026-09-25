"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeGmailAddress, enforceSignupRateLimit } from "@/lib/auth-security";

export async function login(formData: FormData) {
  const email = canonicalizeGmailAddress(String(formData.get("email") || ""));
  const password = formData.get("password") as string;
  if (!email) {
    redirect(`/login?message=${encodeURIComponent('Use a valid Gmail address.')}`);
  }
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut()
    redirect(`/login?message=${encodeURIComponent('Please verify your email before signing in.')}`)
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = canonicalizeGmailAddress(String(formData.get("email") || ""));
  const password = formData.get("password") as string;
  if (!email) {
    redirect(`/login?message=${encodeURIComponent('Sign up with a Gmail address.')}`);
  }
  await enforceSignupRateLimit();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (!data.user?.email_confirmed_at) {
    if (data.session) await supabase.auth.signOut();
    redirect(`/login?message=${encodeURIComponent('Check your email to verify your account before signing in.')}`)
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
