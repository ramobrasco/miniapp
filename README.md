# Should I? (Base miniapp)

A fun, lightweight decision app. Ask “Should I…?” questions and get a quick Yes 👍 / No 👎 / Wait ⏳ / Depends 🤷 from the crowd. Voting is anonymous and offchain (no transactions).

## Stack

- **Frontend**: Next.js 14, Tailwind, wagmi, viem, Base (Sepolia + mainnet)
- **Backend**: Next.js API, Supabase (Postgres + Storage), SIWE for auth
- **Voting**: Offchain (stored in DB); no smart contract required for MVP

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
   - Create a storage bucket `question-images` (public read; allow authenticated uploads or use RLS).
   - Copy `env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

3. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Connect wallet, sign in (when asking or voting), then ask a question and vote.

## Env

See [env.example](env.example). Required: Supabase URL + anon + service key. For production you must set `NEXT_PUBLIC_APP_ORIGIN` to your deployed URL (e.g. `https://your-app.vercel.app`) so SIWE sign-in works.

## Deploy (Vercel + production Supabase)

1. **Production Supabase**
   - Use your existing project or create a new one at [supabase.com](https://supabase.com).
   - Ensure [supabase/schema.sql](supabase/schema.sql) has been run (tables `questions`, `votes`, `vote_results`, storage bucket, RLS).
   - In Supabase Dashboard → Settings → API: copy **Project URL**, **anon public** key, and **service_role** key (keep service_role secret).

2. **Vercel**
   - Push your repo to GitHub (if not already).
   - Go to [vercel.com](https://vercel.com) → Add New → Project → Import your repo.
   - Framework preset: Next.js. Root: leave default. Deploy once (it may fail until env is set).

3. **Environment variables (Vercel)**
   - Project → Settings → Environment Variables. Add for **Production** (and Preview if you want):
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon public key
     - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key (secret)
     - `NEXT_PUBLIC_APP_ORIGIN` = your Vercel URL, e.g. `https://your-project.vercel.app` (no trailing slash)
   - Save. Redeploy: Deployments → … on latest → Redeploy.

4. **Post-deploy**
   - Open `NEXT_PUBLIC_APP_ORIGIN` in the browser. Connect wallet, sign in, ask a question, and vote to confirm.
   - (Optional) Add a custom domain in Vercel and set `NEXT_PUBLIC_APP_ORIGIN` to that domain, then redeploy.

## Flow

- **Ask**: Connect wallet → Sign In with Ethereum (SIWE) → optional image upload → POST question (must start with “Should I…”).
- **Vote**: Open question → Connect wallet → POST vote (no transaction). Results (percentages) appear only after you vote.
- **My questions / My votes**: From DB; wallet identity via session.

Questions are open for 24 hours from `created_at`; voting is allowed only within that window.
