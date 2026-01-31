# Step-by-step: Deploy to Base app

Everything that could be done in code is done. Follow these steps **in order** to finish setup and publish your mini-app on Base app.

---

## 1. Set environment variable in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and select your **Miniapp** project.
2. Go to **Settings** → **Environment Variables**.
3. Add (or update):
   - **Name:** `NEXT_PUBLIC_APP_ORIGIN`
   - **Value:** `https://miniapp-dun-one.vercel.app`
   - **Environment:** Production (and Preview if you want)
4. Save. **Redeploy** the project (Deployments → … on latest → Redeploy) so the new variable is used.

---

## 2. Deploy and confirm the manifest

1. Push your latest code and let Vercel deploy (or use the redeploy from step 1).
2. After deploy, open in a browser:
   - **Manifest:** https://miniapp-dun-one.vercel.app/.well-known/farcaster.json  
   You should see JSON with `accountAssociation` (empty strings for now) and `miniapp` (name, homeUrl, etc.).
3. Optional checks:
   - https://miniapp-dun-one.vercel.app/og-image — default OG image
   - https://miniapp-dun-one.vercel.app/icons/icon-512x512 — app icon

---

## 3. Create account association (Base Build)

1. Go to the **Base Build Account association** page:  
   https://www.base.dev/preview?tab=account  
2. In **App URL**, enter: `miniapp-dun-one.vercel.app` (no `https://`).
3. Click **Submit**.
4. Click **Verify** and follow the instructions (you’ll sign a message with your wallet).
5. After it succeeds, copy the three values shown:
   - **header**
   - **payload**
   - **signature**

---

## 4. Add account association in Vercel

1. In Vercel → your project → **Settings** → **Environment Variables**.
2. Add these three variables (paste the exact values from step 3):
   - **FARCASTER_ACCOUNT_ASSOCIATION_HEADER** = (header value)
   - **FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD** = (payload value)
   - **FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE** = (signature value)
3. **Redeploy** the project again so `/.well-known/farcaster.json` includes the new `accountAssociation`.

---

## 5. Preview your app on Base Build

1. Go to the **Base Build Preview** tool:  
   https://www.base.dev/preview  
2. Enter your app URL: `https://miniapp-dun-one.vercel.app`
3. Check:
   - **Preview** tab: embed and “Launch” button look correct.
   - **Account association** tab: shows as verified.
   - **Metadata** tab: fields from the manifest look correct.

---

## 6. Publish to Base app

1. In the **Base app** (Farcaster), create a **new post**.
2. Paste your app URL: `https://miniapp-dun-one.vercel.app`
3. Post. Base app will show a rich embed with a “Launch” button; users can open your mini-app from there.

---

## Summary

| Step | What you do |
|------|------------------|
| 1 | Set `NEXT_PUBLIC_APP_ORIGIN=https://miniapp-dun-one.vercel.app` in Vercel and redeploy |
| 2 | Confirm `/.well-known/farcaster.json` and assets load |
| 3 | Run Account association at base.dev/preview?tab=account and copy header, payload, signature |
| 4 | Add the three `FARCASTER_ACCOUNT_ASSOCIATION_*` env vars in Vercel and redeploy |
| 5 | Check everything at base.dev/preview |
| 6 | Post your app URL in Base app to publish |

If something doesn’t match (e.g. wrong domain or env not set), fix the env vars and redeploy, then repeat from step 2.

---

## Sign-in in Base app browser ("Verification failed")

If sign-in shows "Verification failed" when opening the app inside Base app’s integrated browser:

1. **Vercel env:** In Vercel → Settings → Environment Variables, ensure **`NEXT_PUBLIC_APP_ORIGIN`** is set to **`https://miniapp-dun-one.vercel.app`** for **Production**. This is used for SIWE so the signature verifies correctly when embedded.
2. **Redeploy:** After changing env vars or code, trigger a new deployment and wait until it finishes.
3. **Try again:** Open your app URL in Base app’s browser and sign in. If the cookie still can’t be set (e.g. strict privacy), verification will still succeed and you’ll see success; the session may not persist until you open the app in a normal browser.

**Passkey / Base app wallet:** Sign-in from Base app uses the built-in passkey wallet. The backend supports **EIP-1271**: when standard ECDSA verification fails (e.g. passkey blob), it calls the wallet contract’s `isValidSignature(hash, signature)` on Base mainnet/Sepolia. No extra env vars are required; optional `BASE_MAINNET_RPC_URL` and `BASE_SEPOLIA_RPC_URL` override the default RPCs.
