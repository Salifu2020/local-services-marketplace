# Switch to Stripe Test Mode - Quick Guide

**Current:** Using LIVE keys (can't use test cards)  
**Solution:** Switch to TEST keys (can use test cards)

---

## 🚀 Quick Steps (5 minutes)

### Step 1: Get Test Keys from Stripe

1. Go to: **https://dashboard.stripe.com/test/apikeys**
2. Make sure you're in **"Test mode"** (toggle in top right)
3. Copy:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`)

---

### Step 2: Update Frontend

**Local (.env file):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

**Vercel (Production):**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Update `VITE_STRIPE_PUBLISHABLE_KEY` to test key
3. Redeploy

---

### Step 3: Update Railway (Backend)

1. Go to: https://railway.app → Your service → Variables
2. Find `STRIPE_SECRET_KEY`
3. Click **"Edit"**
4. Change to test key: `sk_test_your_test_key_here`
5. Click **"Save"**
6. Railway will auto-redeploy

---

### Step 4: Test

1. Restart dev server (if local)
2. Go to "My Bookings"
3. Click "Pay Now"
4. Use test card: `4242 4242 4242 4242`
5. Should work now! ✅

---

## ✅ After Switching

- ✅ Test cards will work
- ✅ No real charges
- ✅ Safe for development
- ✅ Easy to test payment flow

---

## 🔄 Switch Back to Live (When Ready)

When ready for production:
1. Get live keys from: https://dashboard.stripe.com/apikeys
2. Update both frontend and backend
3. Test with real cards (small amounts first)

---

**Get your test keys and I'll help you update everything!** 🚀

