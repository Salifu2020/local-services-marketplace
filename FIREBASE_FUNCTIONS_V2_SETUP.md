# Firebase Functions v2 Setup Guide

**Status:** ✅ Code Ready | 🚀 Ready to Deploy

---

## ✅ What Was Fixed

1. **Updated to Firebase Functions v2 API**
   - Using `onCall` from `firebase-functions/v2/https`
   - Using `onRequest` from `firebase-functions/v2/https`
   - Using `defineSecret` for secure secret management

2. **Fixed ESLint Errors**
   - Added JSDoc comments
   - Fixed trailing commas
   - Removed unused variables
   - Fixed `new-cap` error

3. **Added Stripe Dependency**
   - Added `stripe` package to `package.json`

---

## 🚀 Deployment Steps

### Step 1: Set Stripe Secrets

Firebase Functions v2 uses secrets instead of config. Set them using:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# When prompted, paste your Stripe secret key: sk_test_...

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# When prompted, paste your webhook secret: whsec_...
```

**Note:** You'll get the webhook secret after configuring the webhook in Stripe Dashboard.

### Step 2: Deploy Functions

```bash
cd functions
npm install  # If not already done
cd ..
firebase deploy --only functions
```

### Step 3: Get Function URLs

After deployment, you'll see URLs like:
- `createPaymentIntent`: `https://us-central1-neighborly-52673.cloudfunctions.net/createPaymentIntent`
- `stripeWebhook`: `https://us-central1-neighborly-52673.cloudfunctions.net/stripeWebhook`
- `getPaymentStatus`: `https://us-central1-neighborly-52673.cloudfunctions.net/getPaymentStatus`

### Step 4: Configure Webhook in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL: `https://us-central1-neighborly-52673.cloudfunctions.net/stripeWebhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Set it as a secret:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```
7. Redeploy:
   ```bash
   firebase deploy --only functions
   ```

### Step 5: Update Frontend Environment

Add to `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_USE_FIREBASE_FUNCTIONS=true
```

**For Vercel:**
- Settings → Environment Variables
- Add both variables
- Redeploy

---

## 🔒 Secrets Management

### List Secrets
```bash
firebase functions:secrets:access STRIPE_SECRET_KEY
```

### Update Secret
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
```

### Delete Secret
```bash
firebase functions:secrets:destroy STRIPE_SECRET_KEY
```

---

## 🧪 Testing

### Test Locally (Emulator)

```bash
firebase emulators:start --only functions
```

**Note:** You'll need to set environment variables for local testing:
```bash
# In functions/.env (create if needed)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Payment Flow

1. Complete a booking
2. Go to "My Bookings"
3. Click "Pay Now"
4. Use test card: `4242 4242 4242 4242`
5. Payment should process!

### Test Webhook (Stripe CLI)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local function
stripe listen --forward-to http://localhost:5001/neighborly-52673/us-central1/stripeWebhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## 📊 Functions Created

### 1. `createPaymentIntent`
- **Type:** Callable Function (v2)
- **Purpose:** Creates Stripe Payment Intent
- **Authentication:** Required
- **Secrets:** `STRIPE_SECRET_KEY`

### 2. `stripeWebhook`
- **Type:** HTTP Function (v2)
- **Purpose:** Handles Stripe webhook events
- **Authentication:** None (Stripe signature verification)
- **Secrets:** `STRIPE_WEBHOOK_SECRET`

### 3. `getPaymentStatus`
- **Type:** Callable Function (v2)
- **Purpose:** Retrieves payment status from Stripe
- **Authentication:** Required
- **Secrets:** `STRIPE_SECRET_KEY`

---

## 🐛 Troubleshooting

### "Stripe secret key not configured"
- Make sure you've set the secret: `firebase functions:secrets:set STRIPE_SECRET_KEY`
- Check secret is accessible: `firebase functions:secrets:access STRIPE_SECRET_KEY`

### "Webhook signature verification failed"
- Verify webhook secret is set correctly
- Check webhook URL matches in Stripe Dashboard
- Ensure raw body is passed (v2 handles this automatically)

### "Permission denied"
- Check user is authenticated
- Verify booking belongs to user
- Check Firestore security rules

### Deployment fails
- Check ESLint passes: `cd functions && npm run lint`
- Verify Node.js version matches (v24)
- Check Firebase CLI is up to date: `firebase --version`

---

## 📝 Key Differences: v1 vs v2

### v1 (Old)
```javascript
exports.myFunction = functions.https.onCall(async (data, context) => {
  // ...
});
```

### v2 (New)
```javascript
exports.myFunction = onCall(
  { secrets: [mySecret], cors: true },
  async (request) => {
    // request.auth instead of context.auth
    // request.data instead of data
  }
);
```

### Secrets: v1 vs v2

**v1:**
```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
```

**v2:**
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
```

---

## ✅ Checklist

- [ ] Stripe secret key set
- [ ] Functions deployed
- [ ] Webhook configured in Stripe
- [ ] Webhook secret set
- [ ] Frontend environment variables set
- [ ] Test payment flow
- [ ] Test webhook with Stripe CLI

---

**Ready to deploy! Follow the steps above.** 🚀

