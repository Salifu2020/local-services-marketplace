# Restart Dev Server to Load Stripe Key

**Issue:** Payment modal shows mock payment instead of Stripe card input

**Solution:** Restart your dev server

---

## 🔄 How to Restart

### Step 1: Stop Current Server
- Go to your terminal where `npm run dev` is running
- Press `Ctrl+C` to stop it

### Step 2: Start Server Again
```bash
npm run dev
```

### Step 3: Hard Refresh Browser
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or close and reopen the browser tab

### Step 4: Test Again
1. Go to "My Bookings"
2. Click "Pay Now"
3. You should now see the **Stripe card input** instead of mock payment! 🎉

---

## ✅ What You Should See After Restart

**Before (Current):**
- Mock payment message
- "Pay $19.00" button (no card input)

**After (Expected):**
- Stripe card input field
- Card number, expiry, CVC fields
- Test card info displayed
- "Pay $19.00" button (with card input)

---

## 🧪 Verify Key is Loaded

Open browser console (F12) and run:
```javascript
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
```

**Should show:** `pk_live_51SYzW1RqfMvgxU2D3MBmXIE9l8iNwUKYKd1AC31BOVvF7oYxvN7hXbkihLFybbP3PwOqn5aq6MwvAynerReme78j006RUxjXm9`

**If it shows `undefined`:** The server needs to be restarted.

---

**Restart your dev server and the Stripe card input should appear!** 🚀

