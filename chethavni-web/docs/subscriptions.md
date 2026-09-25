# Subscriptions setup

## Database

Run both `../supabase/migrations/20260925_subscriptions_and_usage.sql` and `../supabase/migrations/20260925_signup_abuse_controls.sql` in the Supabase SQL editor. The migrations are additive and create the usage, manual subscription, free entitlement, and signup rate-limit records used by the web app and Go engine.

## Environment

Add these server variables to the web app:

- `SUPABASE_SERVICE_ROLE_KEY`: server-only key used by the protected admin actions.
- `ADMIN_EMAILS`: comma-separated administrator email addresses, for example `you@example.com`.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: WhatsApp number with country code and digits only, for example `919876543210`.

Keep `SUPABASE_SERVICE_ROLE_KEY` out of all `NEXT_PUBLIC_` variables and browser code.

## Manual activation

1. Add the admin email to `ADMIN_EMAILS`.
2. Sign in with that account and open `/admin`.
3. Search for the customer's account email.
4. Activate Starter or Pro after confirming payment.

Activating a paid plan extends from the existing future expiry date when renewing. Downgrading preserves the user's workflows and data while applying Free limits to new actions and executions.

## Current abuse controls

The app accepts Gmail addresses only and canonicalizes Gmail dots and plus aliases before signup. For example, `first.last+test@gmail.com` is treated as `firstlast@gmail.com`. Signup attempts are limited to five per IP hash per hour by `signup_rate_limits`; raw IP addresses are not stored. The app also requires `email_confirmed_at` before login or completing signup.

Enable **Confirm email** in Supabase Auth settings. The email confirmation redirect must point to the deployed app's `/auth/callback` route.

Gmail-only signup and IP throttling reduce casual abuse but cannot stop someone from creating multiple Gmail accounts. CAPTCHA/Turnstile remains an optional additional control that requires provider credentials and an extra verification field in the signup form. The execution engine still enforces usage by `user_id`, not source IP.