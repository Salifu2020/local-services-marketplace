# Verify Railway Deployment Setup 🔍

**Issue:** API URL returns HTML instead of API response

---

## 🔍 Problem

The URL `https://local-services-marketplace-production.up.railway.app` is returning HTML (your frontend app) instead of the API response.

This means either:
1. Railway is deploying the wrong service (frontend instead of backend)
2. The backend needs a different path/subdomain
3. Root directory not set correctly in Railway

---

## ✅ Solution: Check Railway Configuration

### Step 1: Verify Railway Service

1. Go to: https://railway.app
2. Open your project
3. Check which service is deployed:
   - Is it the `server` folder?
   - Or is it the root folder (frontend)?

### Step 2: Check Root Directory

1. Click on the service
2. Go to **"Settings"** → **"Root Directory"**
3. Should be set to: **`server`**
4. If not, change it and redeploy

### Step 3: Check Build Settings

1. Go to **"Settings"** → **"Build"**
2. Verify:
   - **Start Command:** `npm start`
   - **Build Command:** (leave empty or `npm install`)

### Step 4: Check Environment Variables

1. Go to **"Variables"** tab
2. Verify these are set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PORT=3000`

---

## 🚀 Alternative: Create Separate Service

If the current service is the frontend, create a new service for the API:

1. In Railway project, click **"New"** → **"Service"**
2. Select **"GitHub Repo"**
3. Choose your repo: `local-services-marketplace`
4. Set **Root Directory:** `server`
5. Add environment variables
6. Deploy

This will give you a separate API URL like:
- `https://payment-api-production.up.railway.app`

---

## 🧪 Test Correct Endpoint

Once you have the correct API URL, test:

```bash
# Health check
curl https://your-api-url.com/health
# Should return: {"status":"ok"}

# Not HTML!
```

---

## 📋 Quick Fix Checklist

- [ ] Railway service root directory = `server`
- [ ] Environment variables set
- [ ] Service is running (check logs)
- [ ] `/health` endpoint returns JSON, not HTML
- [ ] Frontend `VITE_API_URL` points to correct API URL

---

**Check your Railway dashboard and let me know what you find!** 🔍

