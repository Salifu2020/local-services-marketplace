# Stripe Payment Setup - Immediate Solution

**Status:** ⚠️ Firebase Functions requires Blaze plan | ✅ Express API ready

---

## 🎯 Two Options

### Option 1: Upgrade Firebase to Blaze Plan (Recommended)
**Time:** 5 minutes  
**Cost:** Pay-as-you-go (free tier available)

### Option 2: Use Express API Server (Immediate)
**Time:** 10 minutes  
**Cost:** Free (deploy to Railway/Heroku free tier)

---

## 🚀 Option 1: Upgrade Firebase (Recommended)

### Step 1: Upgrade to Blaze Plan
1. Visit: https://console.firebase.google.com/project/neighborly-52673/usage/details
2. Click "Upgrade to Blaze"
3. Follow the prompts (credit card required, but free tier available)

### Step 2: Set Stripe Secret
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste: sk_live_YOUR_STRIPE_SECRET_KEY_HERE
```

### Step 3: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 4: Get Function URLs
After deployment, note the URLs:
- `createPaymentIntent`: `https://us-central1-neighborly-52673.cloudfunctions.net/createPaymentIntent`
- `stripeWebhook`: `https://us-central1-neighborly-52673.cloudfunctions.net/stripeWebhook`

### Step 5: Configure Webhook in Stripe
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://us-central1-neighborly-52673.cloudfunctions.net/stripeWebhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook secret

### Step 6: Set Webhook Secret
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste the webhook secret from Stripe
firebase deploy --only functions
```

---

## 🚀 Option 2: Express API Server (Immediate - No Upgrade Needed)

### Step 1: Create .env File
Create `server/.env`:
```
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe after setting up webhook)
PORT=3000
```

### Step 2: Install Dependencies
```bash
cd server
npm install
```

### Step 3: Test Locally (Optional)
```bash
npm start
# Server runs on http://localhost:3000
```

### Step 4: Deploy to Railway (Free)
1. Go to: https://railway.app
2. Sign up/login
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your repo
6. Set root directory: `server`
7. Add environment variables:
   - `STRIPE_SECRET_KEY`: `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...` (after webhook setup)
   - `PORT`: `3000`
8. Deploy

### Step 5: Get API URL
After deployment, you'll get a URL like:
`https://your-app-name.up.railway.app`

### Step 6: Configure Webhook in Stripe
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-app-name.up.railway.app/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook secret
6. Update `STRIPE_WEBHOOK_SECRET` in Railway

### Step 7: Update Frontend
Add to `.env` (or Vercel environment variables):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (get from Stripe Dashboard)
VITE_API_URL=https://your-app-name.up.railway.app
```

---

## 📝 Get Your Stripe Publishable Key

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the **Publishable key** (starts with `pk_live_...`)
3. Add to frontend environment variables

---

## ✅ Which Option Should You Choose?

### Choose Option 1 (Firebase) if:
- ✅ You want everything in one place (Firebase)
- ✅ You're okay upgrading to Blaze plan
- ✅ You want integrated Firestore updates

### Choose Option 2 (Express API) if:
- ✅ You want to start immediately
- ✅ You don't want to upgrade Firebase yet
- ✅ You want more control over the API

---

## 🧪 Testing

### Test Payment Flow:
1. Complete a booking
2. Go to "My Bookings"
3. Click "Pay Now"
4. Use test card: `4242 4242 4242 4242`
5. Payment should process!

**Note:** Since you're using a LIVE key, use real cards or switch to test mode for testing.

---

## 🔒 Security Notes

- ✅ Secret key is stored securely (Firebase Secrets or environment variables)
- ✅ Never commit secret keys to Git
- ✅ Webhook signature verification enabled
- ✅ HTTPS required for production

---

**Ready to proceed! Which option do you prefer?** 🚀

