# Auth setup — admin account, e-mails, and getting off Lovable's sender

_Everything here is Supabase dashboard configuration. It cannot be done from the repo,
so it is the checklist for whoever owns the Supabase project._

Supabase project: `pwbrjfdxkcpndowwtjea`

---

## 1. Create the admin account

**No password is stored in this repository, deliberately.** The repo is public — a
committed credential would be readable by anyone. Instead the migration
`20260819090000_admin_roles.sql` grants the admin role **by e-mail address**:

```sql
CASE WHEN lower(NEW.email) = 'lyamcorpo@gmail.com' THEN 'admin' ELSE 'user' END
```

So the account becomes an admin automatically, whenever it is created:

1. Go to the live site → **Créer un compte gratuit**
2. Sign up as `lyamcorpo@gmail.com` with the password you chose
3. Confirm the e-mail
4. Sign in — an **Admin** link appears in the navbar, and `/admin` opens

If the account already existed before this migration ran, the migration's backfill
promotes it on the spot. Nothing else to do.

> ⚠️ The password for this account was shared in a chat transcript during setup.
> Change it once you're in, via **Mot de passe oublié** on the login page.

### Adding more admins later

An admin can promote anyone from `/admin` — that's the "Rendre admin" button, meant
for handing customer support to someone else. An admin cannot remove their **own**
admin access (the RPC rejects it), so the console can't be locked out by accident.

---

## 2. Redirect URLs — do this before testing password reset

Supabase refuses to redirect to a URL that isn't allow-listed, and the failure looks
like a broken reset link rather than a config error. This bites everyone once.

**Dashboard → Authentication → URL Configuration:**

| Field | Value |
|---|---|
| Site URL | your production URL (the Cloudflare one once live) |
| Redirect URLs | `https://<your-domain>/reset-password`, `https://<your-domain>/dashboard`, plus `http://localhost:5173/**` for local dev |

The app requests these two redirect targets:

- `${origin}/reset-password` — password recovery
- `${origin}/dashboard` — e-mail confirmation after signup

---

## 3. Replace Lovable's e-mail sender

Right now confirmation and reset e-mails go out through the default sender inherited
from the Lovable-provisioned project. Two problems: you don't control it, and the
built-in Supabase sender is rate-limited to a handful of e-mails per hour — fine for
testing, not for real signups.

Fix: point Supabase at your own SMTP provider.

### Pick a provider

| Provider | Free tier | Notes |
|---|---|---|
| **Resend** | 3 000/month | Simplest setup, good deliverability. Recommended. |
| Brevo | 300/day | Generous, EU-based |
| Mailgun / SendGrid | limited trials | Fine if you already use them |

### Wire it up

1. Create the account, **verify your sending domain** (add the DKIM/SPF DNS records
   they give you — without this, mail lands in spam)
2. Generate an SMTP username + password
3. **Supabase → Project Settings → Authentication → SMTP Settings** → *Enable Custom SMTP*:

   | Field | Value |
   |---|---|
   | Sender email | `no-reply@yourdomain.ma` |
   | Sender name | `Lyamfi` |
   | Host | e.g. `smtp.resend.com` |
   | Port | `465` |
   | Username / Password | from the provider |

4. **Save**, then send yourself a test signup.

Once this is live, nothing about account e-mail depends on Lovable.

### Translate the e-mails

The app is in French but Supabase's default templates are English.
**Authentication → Email Templates** — edit *Confirm signup* and *Reset password*.
Keep the `{{ .ConfirmationURL }}` variable exactly as-is; everything around it is yours.

---

## 4. Password rules

Enforced client-side in `src/lib/password.ts` and shown live as a checklist during
signup and reset — the user sees exactly which condition is missing rather than a
bare "password not secure":

- at least 8 characters
- one lowercase letter
- one uppercase letter
- one digit
- one special character

Supabase has its own minimum (6 by default). Raise it to match under
**Authentication → Providers → Email → Minimum password length**, so the rule holds
even if someone calls the API directly.

---

## 5. What protects the admin page

Worth understanding, because the visible part is the least important part.

| Layer | What it does | Load-bearing? |
|---|---|---|
| Navbar link hidden for non-admins | cosmetic | no |
| `/admin` route shows "Accès réservé" | cosmetic | no |
| **`is_admin()` re-checked inside every RPC** | rejects the call | **yes** |
| **No INSERT/UPDATE/DELETE granted on `user_roles`** | role can't be self-assigned | **yes** |

The anon key ships in the client bundle, so any logged-in user can call the API
directly with their own token. That's expected and fine — the database refuses them.
The two bold rows are the actual security boundary; if you change them, re-check this.

Specifically: `user_roles` grants `authenticated` **SELECT only**. Every write goes
through `admin_set_role()`, which is `SECURITY DEFINER` and re-checks `is_admin()`
before touching anything. Without that split, a user could simply `UPDATE` their own
row to `admin`.
