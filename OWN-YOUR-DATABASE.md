# Moving to your own database — 15 minutes

The Supabase project the app currently uses (`pwbrjfdxkcpndowwtjea`) was created by
Lovable and does not appear in your account. This is the last thing Lovable still
controls. Below is how to replace it with one you own.

**Nothing about the app changes.** The code stays identical — only which database it
points at. Every table, security rule and seed row is already in this repo, so the
new project is one paste away.

---

## What you lose

The existing accounts and their data: any signups, virtual portfolios, trades and
quiz progress living in Lovable's project. If it's still just you and Rayane
testing, that's nothing worth keeping. If real users have signed up, tell me before
you switch and we'll export first.

---

## 1. Create the project

1. **supabase.com** → sign in with **your own** account (create one if needed — free)
2. **New project**
   - Name: `lyamfi`
   - Database password: generate one and **save it in a password manager**; you cannot
     recover it later
   - Region: **Frankfurt (eu-central-1)** — closest to Morocco of the EU options
3. Wait ~2 minutes for it to provision

## 2. Create the schema

1. Left sidebar → **SQL Editor** → **New query**
2. Open **`supabase/setup.sql`** from this repo, copy all of it, paste it in
3. **Run**

That one file contains every migration in order: all tables, row-level security,
the 20 seeded stocks, 37 fundamentals, 6 lessons, the admin role system and the
account-deletion function.

Expect "Success. No rows returned." Any `already exists` error means it had already
been run — harmless.

## 3. Point the app at it

1. Supabase → **Project Settings** → **API**, and copy:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **Publishable / anon key** (the public one — *not* `service_role`)
2. Cloudflare → your Worker → **Settings** → **Variables and Secrets**, set:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | the publishable key |
   | `SUPABASE_URL` | same as above |
   | `SUPABASE_PUBLISHABLE_KEY` | same as above |

3. Update the committed `.env` in the repo to match, and push — Vite reads those
   values at **build** time, so a redeploy alone won't pick up dashboard changes if
   `.env` still holds the old ones.

> The anon key is designed to be public and ships in the browser bundle. Never put
> the `service_role` key in the repo or in a `VITE_` variable.

## 4. Auth settings

**Authentication → URL Configuration:**

- Site URL: your Cloudflare URL
- Redirect URLs: `https://<your-domain>/reset-password` and
  `https://<your-domain>/dashboard`

Without these, password-reset links fail in a way that looks like a code bug.

**Authentication → Providers → Email:** make sure Email is enabled and set the
minimum password length to 8, matching what the app enforces.

## 5. Create the admin account

Sign up on the live site as **`lyamcorpo@gmail.com`**. The signup trigger recognises
that address and assigns the admin role automatically, so no password is ever stored
in this repo. Confirm the email, sign in, and **Admin** appears in the navbar.

Verify it landed:

```sql
select u.email, r.role
from auth.users u
left join public.user_roles r on r.user_id = u.id
order by u.created_at;
```

## 6. Your own e-mail sender

Supabase's built-in sender is rate-limited to a handful of messages per hour — fine
for the two of you, not for real signups. See `AUTH-SETUP.md` for wiring up Resend
(free tier: 3 000/month).

---

## Then you're fully independent

| Piece | Owner after this |
|---|---|
| Code | your GitHub |
| Hosting | your Cloudflare |
| Database + auth | your Supabase |
| E-mail | your Resend |

Nothing left pointing at Lovable.
