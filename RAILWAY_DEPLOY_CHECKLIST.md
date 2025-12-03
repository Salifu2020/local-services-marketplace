# Railway Deployment - Quick Checklist ✅

**Follow these steps in order:**

---

## ✅ Step 1: Railway Setup
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Create new project
- [ ] Connect GitHub repo: `local-services-marketplace`

---

## ✅ Step 2: Configure Project
- [ ] Click on the service
- [ ] Settings → Root Directory → Set to: `server`
- [ ] Save

---

## ✅ Step 3: Add Environment Variables
- [ ] Variables tab → New Variable
- [ ] `STRIPE_SECRET_KEY` = `sk_live_YOUR_STRIPE_SECRET_KEY_HERE`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_placeholder` (update later)
- [ ] `PORT` = `3000`

---

## ✅ Step 4: Get API URL
- [ ] Settings → Networking → Generate Domain
- [ ] Copy URL: `https://your-app.up.railway.app`
- [ ] Test: `https://your-app.up.railway.app/health` → Should return `{"status":"ok"}`

---

## ✅ Step 5: Configure Stripe Webhook
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Add endpoint: `https://your-app.up.railway.app/webhook`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy webhook secret (`whsec_...`)

---

## ✅ Step 6: Update Webhook Secret
- [ ] Railway → Variables → Edit `STRIPE_WEBHOOK_SECRET`
- [ ] Paste webhook secret
- [ ] Save (auto-redeploys)

---

## ✅ Step 7: Update Frontend
- [ ] Vercel → Settings → Environment Variables
- [ ] Add/Update: `VITE_API_URL` = `https://your-app.up.railway.app`
- [ ] Redeploy Vercel

---

## ✅ Step 8: Test
- [ ] Go to app → My Bookings
- [ ] Click "Pay Now"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Payment should work! 🎉

---

**That's it! Your payment backend is live!** 🚀

