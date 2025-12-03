# Connect Frontend to Payment Backend ✅

**Status:** Backend deployed | Need to connect frontend

---

## 🔗 Quick Connection Steps

### Step 1: Get Your API URL

**What's your API URL?** (from Railway/Heroku/Render)
- Example: `https://your-app.up.railway.app`
- Example: `https://your-app.herokuapp.com`
- Example: `https://your-app.onrender.com`

---

### Step 2: Update Frontend Environment Variables

**For Local Development:**
1. Open `.env` file in project root
2. Update/add:
   ```
   VITE_API_URL=https://your-api-url.com
   ```
3. Restart dev server: `npm run dev`

**For Production (Vercel):**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add/Update:
   - **Key:** `VITE_API_URL`
   - **Value:** Your API URL
   - Click **"Save"**
3. Go to **"Deployments"** tab
4. Click **"Redeploy"** on latest deployment

---

### Step 3: Verify Connection

1. **Test API Health:**
   - Open: `https://your-api-url.com/health`
   - Should see: `{"status":"ok"}`

2. **Test in Browser Console:**
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   // Should show your API URL
   ```

3. **Test Payment Flow:**
   - Go to "My Bookings"
   - Click "Pay Now"
   - Check browser Network tab
   - Should see request to your API

---

## ✅ Verification Checklist

- [ ] API URL obtained from deployment platform
- [ ] `VITE_API_URL` added to `.env` (local)
- [ ] `VITE_API_URL` added to Vercel environment variables
- [ ] Vercel redeployed (if production)
- [ ] Dev server restarted (if local)
- [ ] API health check works
- [ ] Payment flow tested

---

**What's your API URL? I'll help you connect it!** 🔗

