# Deploy to Vercel

Vercel’s serverless environment doesn’t support SQLite (no writable disk). This project uses **Postgres** (e.g. [Neon](https://neon.tech) free tier) for both local dev and production.

---

## 1. Create a Postgres database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. Create a new project (e.g. `sapl-transfermarket`).
3. Open the project → **Connection details**.
4. Copy the **connection string** (e.g. `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).  
   Use the **pooled** connection string if shown (better for serverless).

---

## 2. Push your schema to the new database (once)

On your machine, with the repo and Node set up:

```bash
# Set the production DB URL (use the Neon connection string from step 1)
$env:DATABASE_URL = "postgresql://..."

# Generate Prisma client and push schema to Postgres
npx prisma generate
npx prisma db push
```

After this, your tables exist in Neon. You don’t need to run this again unless you change the Prisma schema.

---

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. **Add New** → **Project**.
3. Import your GitHub repo (`Naeem2111/sapl-transferMarket` or the correct name).
4. **Configure Project** (you can leave most defaults):
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** (default)
   - **Install Command:** `npm install` (default)
5. **Environment Variables** – add these (for Production, and optionally Preview):

   | Name              | Value                    |
   |-------------------|--------------------------|
   | `DATABASE_URL`    | Your Neon connection string (from step 1) |
   | `TWILIO_ACCOUNT_SID` | (optional) For OTP SMS |
   | `TWILIO_AUTH_TOKEN`  | (optional) For OTP SMS |
   | `TWILIO_PHONE_NUMBER`| (optional) For OTP SMS |

   Do **not** commit these values; only set them in Vercel.

6. Click **Deploy**.  
   Vercel will build and deploy. The first deploy may take a couple of minutes.

---

## 4. After the first deploy

- Open the **Admin → Import** page on your live URL and upload your LeagueRepublic CSV to seed players (same as locally).
- If you use Twilio, add the env vars in **Project → Settings → Environment Variables** and redeploy.

---

## 5. Local development after switching to Postgres

Use the same Neon connection string (or a separate Neon database) in your local `.env`:

```
DATABASE_URL="postgresql://..."   # your Neon connection string
```

Then run `npx prisma db push` once and `npm run dev` as usual.

---

## 6. Later: schema changes

When you change `prisma/schema.prisma`:

1. Locally run:
   ```bash
   $env:DATABASE_URL = "postgresql://..."   # your Neon URL
   npx prisma db push
   ```
2. Commit and push; Vercel will redeploy. The `postinstall` script in package.json runs `prisma generate` so the client is ready at build time.

---

## Summary checklist

- [ ] Neon project created and connection string copied
- [ ] `DATABASE_URL` set in Vercel (Neon connection string)
- [ ] `npx prisma db push` run once locally with that `DATABASE_URL`
- [ ] Repo connected to Vercel and deployed
- [ ] (Optional) Twilio env vars set in Vercel if you use OTP SMS
- [ ] LeagueRepublic CSV imported via the app’s Admin → Import
