# Quick Deploy Stripe Payment API - 5 Minutes ⚡

**Your Stripe Secret Key:** ✅ Configured  
**Status:** Ready to deploy!

---

## 🚀 Deploy to Railway (Easiest - Free)

### Step 1: Sign Up (1 min)
1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub

### Step 2: Deploy (2 min)
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `local-services-marketplace`
4. Railway will detect it's a Node.js project

### Step 3: Configure (1 min)
1. Click on the service
2. Go to "Settings" → "Root Directory"
3. Set to: `server`
4. Click "Save"

### Step 4: Add Environment Variables (1 min)
1. Go to "Variables" tab
2. Click "New Variable"
3. Add these three:

**Variable 1:**
- Name: `STRIPE_SECRET_KEY`
- Value: `sk_live_YOUR_STRIPE_SECRET_KEY_HERE`

**Variable 2:**
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_placeholder` (we'll update this after webhook setup)

**Variable 3:**
- Name: `PORT`
- Value: `3000`

4. Railway will automatically redeploy

### Step 5: Get Your API URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://your-app.up.railway.app`)

**✅ API is now live!**

---

## 🔗 Configure Stripe Webhook

### Step 1: Add Webhook Endpoint
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Paste your API URL + `/webhook`:
   ```
   https://your-app.up.railway.app/webhook
   ```
4. Click "Add endpoint"

### Step 2: Select Events
Check these events:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

Click "Add events"

### Step 3: Copy Webhook Secret
1. After creating, you'll see "Signing secret"
2. Click "Reveal" and copy it (starts with `whsec_`)

### Step 4: Update Environment Variable
1. Go back to Railway
2. Variables → Edit `STRIPE_WEBHOOK_SECRET`
3. Paste the webhook secret
4. Save (auto-redeploys)

**✅ Webhook configured!**

---

## 🎨 Update Frontend

### Step 1: Get Stripe Publishable Key
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the **Publishable key** (starts with `pk_live_...`)

### Step 2: Update Vercel Environment Variables
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add:

**Variable 1:**
- Key: `VITE_STRIPE_PUBLISHABLE_KEY`
- Value: `pk_live_...` (your publishable key)

**Variable 2:**
- Key: `VITE_API_URL`
- Value: `https://your-app.up.railway.app` (your Railway URL)

3. Click "Save"
4. Go to "Deployments" → Redeploy

**✅ Frontend updated!**

---

## ✅ Test It!

1. Go to your app
2. Complete a booking
3. Go to "My Bookings"
4. Click "Pay Now"
5. Use test card: `4242 4242 4242 4242`
6. Payment should work! 🎉

---

## 📋 Checklist

- [ ] Deployed to Railway
- [ ] Environment variables set
- [ ] API URL copied
- [ ] Stripe webhook configured
- [ ] Webhook secret updated
- [ ] Frontend environment variables set
- [ ] Tested payment flow

---

## 🆘 Need Help?

**API not working?**
- Check Railway logs
- Verify environment variables
- Test `/health` endpoint

**Webhook not working?**
- Verify webhook URL is correct
- Check webhook secret is set
- Review Railway logs

**Payment failing?**
- Check browser console
- Verify Stripe keys are correct
- Check API logs in Railway

---

**That's it! Your payment system is live!** 🚀

