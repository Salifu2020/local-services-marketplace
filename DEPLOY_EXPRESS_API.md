# Deploy Express API Server - Quick Guide

**Status:** ✅ Server code ready | 🚀 Ready to deploy

---

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier)
**Time:** 5 minutes

1. **Sign up/Login**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure Project**
   - Set root directory: `server`
   - Railway will auto-detect Node.js

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add:
     ```
     STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
     STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)
     PORT=3000
     ```

5. **Deploy**
   - Railway will automatically deploy
   - Wait for deployment to complete

6. **Get Your URL**
   - Click on your service
   - Copy the public URL (e.g., `https://your-app.up.railway.app`)

---

### Option 2: Heroku (Free Tier Available)
**Time:** 10 minutes

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd server
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
   heroku config:set PORT=3000
   ```

5. **Deploy**
   ```bash
   git add server/
   git commit -m "Add payment API server"
   git push heroku main
   ```

6. **Get Your URL**
   ```bash
   heroku info
   # URL will be: https://your-app-name.herokuapp.com
   ```

---

### Option 3: Render (Free Tier)
**Time:** 5 minutes

1. **Sign up/Login**
   - Go to: https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo

3. **Configure**
   - Name: `payment-api`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Add Environment Variables**
   - Scroll to "Environment Variables"
   - Add:
     ```
     STRIPE_SECRET_KEY=sk_live_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     PORT=3000
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

6. **Get Your URL**
   - Copy the service URL (e.g., `https://payment-api.onrender.com`)

---

## 🔧 After Deployment

### 1. Test the API
```bash
curl https://your-api-url.com/health
# Should return: {"status":"ok"}
```

### 2. Configure Stripe Webhook

1. **Go to Stripe Dashboard**
   - https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - Click "Add endpoint"
   - URL: `https://your-api-url.com/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

3. **Copy Webhook Secret**
   - After creating, copy the "Signing secret" (starts with `whsec_`)

4. **Update Environment Variable**
   - Go back to your hosting platform
   - Update `STRIPE_WEBHOOK_SECRET` with the secret
   - Redeploy if needed

---

## 📝 Update Frontend

### Get Stripe Publishable Key
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the **Publishable key** (starts with `pk_live_...`)

### Update Environment Variables

**For Vercel:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_API_URL=https://your-api-url.com
   ```
4. Redeploy

**For Local Development:**
Create/update `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-api-url.com
```

---

## ✅ Testing

### Test Payment Flow:
1. Complete a booking in your app
2. Go to "My Bookings"
3. Click "Pay Now"
4. Use a test card: `4242 4242 4242 4242`
5. Payment should process!

**Note:** Since you're using a LIVE key, be careful with real payments. Consider using test mode for development.

---

## 🔒 Security Checklist

- ✅ Secret key stored in environment variables (not in code)
- ✅ `.env` file in `.gitignore`
- ✅ Webhook signature verification enabled
- ✅ HTTPS required (all platforms provide this)
- ✅ CORS configured

---

## 🐛 Troubleshooting

### "Cannot connect to API"
- Check API URL is correct
- Verify environment variable `VITE_API_URL` is set
- Check API is deployed and running

### "Payment intent creation failed"
- Check Stripe secret key is correct
- Verify API logs for errors
- Check network tab in browser DevTools

### "Webhook not working"
- Verify webhook URL is correct
- Check webhook secret is set
- Review API logs for webhook events

---

**Ready to deploy! Choose your platform and follow the steps.** 🚀

