# Stripe Live vs Test Mode - Fix Guide

**Issue:** Using test card with live Stripe keys  
**Error:** "Your card was declined. Your request was in live mode, but used a known test card."

---

## 🔍 What's Happening

You're using **LIVE Stripe keys**:
- `pk_live_...` (publishable key)
- `sk_live_...` (secret key)

But trying to use **TEST cards** (`4242 4242 4242 4242`)

**Stripe Rules:**
- ✅ **Test keys** + **Test cards** = Works
- ✅ **Live keys** + **Real cards** = Works
- ❌ **Live keys** + **Test cards** = Declined

---

## ✅ Solution Options

### Option 1: Switch to Test Mode (Recommended for Development)

**Best for:** Development and testing

1. **Get Test Keys from Stripe:**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy **Test Publishable Key** (`pk_test_...`)
   - Copy **Test Secret Key** (`sk_test_...`)

2. **Update Frontend (.env):**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
   ```

3. **Update Railway Environment Variables:**
   - Go to Railway → Your service → Variables
   - Update `STRIPE_SECRET_KEY` to test key: `sk_test_...`
   - Railway will auto-redeploy

4. **Test with Test Cards:**
   - Card: `4242 4242 4242 4242`
   - This will now work! ✅

**Note:** You can switch back to live keys when ready for production.

---

### Option 2: Use Real Cards (Not Recommended for Testing)

**Only if:** You want to test with real payments

⚠️ **Warning:** This will charge real money!

You can use real credit cards, but:
- Real charges will be made
- You'll need to refund manually
- Not recommended for testing

---

### Option 3: Create Test Payment in Stripe Dashboard

**For:** Quick testing without code changes

1. Go to: https://dashboard.stripe.com/test/payments
2. Click **"Create payment"**
3. Use test card: `4242 4242 4242 4242`
4. This works in test mode

---

## 🎯 Recommended: Switch to Test Mode

**Why:**
- ✅ Safe for testing
- ✅ No real charges
- ✅ Test cards work
- ✅ Easy to switch back to live later

**Steps:**
1. Get test keys from Stripe Dashboard
2. Update `.env` with test publishable key
3. Update Railway with test secret key
4. Test with `4242 4242 4242 4242`

---

## 📝 Quick Switch to Test Mode

### Frontend (.env):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

### Railway:
- Variables → `STRIPE_SECRET_KEY` → `sk_test_your_test_key_here`

---

## 🔄 Switch Back to Live (When Ready)

When ready for production:
1. Use live keys again
2. Test with real cards (small amounts)
3. Monitor in Stripe Dashboard

---

**Want me to help you switch to test mode?** Just get your test keys from Stripe Dashboard and I'll update the configuration! 🚀

