# Subscriptions setup

## Database

Run `../supabase/migrations/20260925_subscriptions_and_usage.sql` in the Supabase SQL editor. The migration is additive and creates the usage, manual subscription, and free entitlement records used by the web app and Go engine.

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

The migration records a free entitlement for each new Auth user, and the app requires verified email before sign-in. The execution engine enforces usage by `user_id`, not source IP. CAPTCHA/Turnstile and signup-IP throttling still require deployment-specific integration because this repository currently uses a direct Supabase server action signup with no request-IP boundary.