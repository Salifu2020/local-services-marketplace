# Get Your Stripe Keys - Quick Guide

**You have:** Secret Key ✅ (`sk_live_...`)  
**You need:** Publishable Key ⏳ (`pk_live_...`)

---

## 🎯 Get Your Publishable Key (1 minute)

### Step 1: Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/apikeys

### Step 2: Copy Publishable Key
- You'll see two keys:
  - **Secret key** (starts with `sk_live_...`) - ✅ You already have this
  - **Publishable key** (starts with `pk_live_...`) - ⏳ Copy this one

### Step 3: Add to Your App

**For Local Development:**
1. Create `.env` file in project root
2. Add:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   ```
3. Restart dev server: `npm run dev`

**For Production (Vercel):**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add:
   - Key: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_live_your_key_here`
3. Redeploy

---

## ✅ After Adding the Key

1. **Restart your dev server** (if local)
2. **Refresh your browser**
3. **Click "Pay Now"** again
4. **You should see the payment form!** 🎉

---

## 🔒 Security Notes

- ✅ **Publishable key** is safe to use in frontend (starts with `pk_`)
- ❌ **Secret key** must NEVER be in frontend code (starts with `sk_`)
- ✅ Your secret key is safely stored in `server/.env` (backend only)

---

**That's it! Once you add the publishable key, the payment modal will work.** 🚀

