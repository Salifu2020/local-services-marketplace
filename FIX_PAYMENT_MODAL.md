# Fix Payment Modal - Quick Solution

**Issue:** Payment modal not showing when clicking "Pay Now"

**Root Cause:** Missing Stripe publishable key in environment variables

---

## ✅ Quick Fix (2 minutes)

### Step 1: Get Your Stripe Publishable Key

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the **Publishable key** (starts with `pk_live_...`)

### Step 2: Add to Environment Variables

**For Local Development:**
1. Create `.env` file in project root (if it doesn't exist)
2. Add:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   VITE_API_URL=http://localhost:3000
   ```
3. Restart dev server: `npm run dev`

**For Production (Vercel):**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add:
   - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_your_key_here`
   - `VITE_API_URL` = `https://your-api-url.com` (if API is deployed)
3. Redeploy

---

## 🔍 What's Happening

The payment modal checks for `VITE_STRIPE_PUBLISHABLE_KEY`:
- ✅ **If set:** Shows payment form with card input
- ❌ **If not set:** Shows warning message "Stripe Not Configured"

If you see nothing, it might be:
1. Modal is rendering but hidden (check z-index)
2. JavaScript error preventing render
3. Environment variable not loaded (restart needed)

---

## 🧪 Test It

1. Open browser console (F12)
2. Check for errors
3. Click "Pay Now" again
4. You should see either:
   - Payment form (if key is set) ✅
   - Warning message (if key is missing) ⚠️

---

## 📝 Full Setup Checklist

- [ ] Get Stripe publishable key from dashboard
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to environment variables
- [ ] Add `VITE_API_URL` (if using Express API)
- [ ] Restart dev server (if local)
- [ ] Redeploy (if production)
- [ ] Test payment modal

---

**After adding the key, the payment modal should work!** 🚀

