# Deploy Payment Backend - Step by Step 🚀

**Time:** 15-20 minutes  
**Platform:** Railway (Recommended - Free tier available)

---

## ✅ Pre-Deployment Checklist

- [x] Server code ready (`server/server.js`)
- [x] Dependencies defined (`server/package.json`)
- [x] Stripe secret key available
- [ ] Railway account (we'll create this)
- [ ] GitHub repo connected

---

## 🚀 Step 1: Sign Up for Railway (2 min)

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended - easiest)
4. Authorize Railway to access your GitHub

---

## 🚀 Step 2: Create New Project (1 min)

1. Click **"New Project"** (or "New +" button)
2. Select **"Deploy from GitHub repo"**
3. Find and select your repository: **`local-services-marketplace`**
4. Railway will detect it's a Node.js project

---

## 🚀 Step 3: Configure Project (2 min)

1. Click on the service that was created
2. Go to **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Set to: **`server`**
5. Click **"Save"**

**Why:** This tells Railway to deploy from the `server/` folder, not the root.

---

## 🚀 Step 4: Add Environment Variables (2 min)

1. Go to **"Variables"** tab
2. Click **"New Variable"**
3. Add these **three variables**:

### Variable 1: STRIPE_SECRET_KEY
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** `sk_live_YOUR_STRIPE_SECRET_KEY_HERE`
- Click **"Add"**

### Variable 2: STRIPE_WEBHOOK_SECRET
- **Name:** `STRIPE_WEBHOOK_SECRET`
- **Value:** `whsec_placeholder` (we'll update this after webhook setup)
- Click **"Add"**

### Variable 3: PORT
- **Name:** `PORT`
- **Value:** `3000`
- Click **"Add"**

4. Railway will automatically redeploy after adding variables

---

## 🚀 Step 5: Get Your API URL (1 min)

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://your-app-name.up.railway.app`)
4. **Save this URL** - you'll need it!

**Example:** `https://payment-api-production.up.railway.app`

---

## 🚀 Step 6: Test Your API (1 min)

1. Open the API URL in a new tab
2. Add `/health` to the end
3. Example: `https://your-app.up.railway.app/health`
4. You should see: `{"status":"ok"}`

✅ **If you see this, your API is live!**

---

## 🔗 Step 7: Configure Stripe Webhook (3 min)

1. Go to: **https://dashboard.stripe.com/webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** Paste your Railway URL + `/webhook`
   - Example: `https://your-app.up.railway.app/webhook`
4. **Description:** "Payment webhook for local services app"
5. Click **"Add endpoint"**

6. **Select Events:**
   - ✅ Check: `payment_intent.succeeded`
   - ✅ Check: `payment_intent.payment_failed`
   - Click **"Add events"**

7. **Copy Webhook Secret:**
   - After creating, you'll see "Signing secret"
   - Click **"Reveal"** and copy it (starts with `whsec_`)

---

## 🔧 Step 8: Update Webhook Secret (1 min)

1. Go back to Railway
2. **Variables** tab
3. Find `STRIPE_WEBHOOK_SECRET`
4. Click **"Edit"**
5. Paste the webhook secret you copied
6. Click **"Save"**
7. Railway will auto-redeploy

---

## 🎨 Step 9: Update Frontend (2 min)

### For Vercel (Production):

1. Go to: **https://vercel.com/your-project/settings/environment-variables**
2. Add/Update:

**Variable 1:**
- **Key:** `VITE_API_URL`
- **Value:** Your Railway URL (e.g., `https://your-app.up.railway.app`)
- Click **"Save"**

3. Go to **"Deployments"** tab
4. Click **"Redeploy"** on the latest deployment

### For Local Development:

1. Open `.env` file in project root
2. Update:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```
3. Restart dev server: `npm run dev`

---

## ✅ Step 10: Test Payment Flow (2 min)

1. Go to your app
2. Complete a booking
3. Go to **"My Bookings"**
4. Click **"Pay Now"** on a booking
5. Use test card: `4242 4242 4242 4242`
6. Payment should process! 🎉

---

## 🐛 Troubleshooting

### API not responding?
- Check Railway logs: **"Deployments"** → Click deployment → **"View Logs"**
- Verify environment variables are set
- Check root directory is set to `server`

### Webhook not working?
- Verify webhook URL is correct
- Check webhook secret is set in Railway
- Review Railway logs for webhook events

### Payment failing?
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check Railway logs for API errors

---

## 📋 Deployment Checklist

- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] Root directory set to `server`
- [ ] Environment variables added (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PORT)
- [ ] API URL generated
- [ ] API health check passed (`/health`)
- [ ] Stripe webhook configured
- [ ] Webhook secret updated in Railway
- [ ] Frontend environment variable updated (`VITE_API_URL`)
- [ ] Payment flow tested

---

## 🎯 Alternative Platforms

### Heroku:
- See `DEPLOY_EXPRESS_API.md` for Heroku instructions

### Render:
- Similar to Railway
- Free tier available
- See `DEPLOY_EXPRESS_API.md` for details

---

**Ready to deploy? Start with Step 1!** 🚀

