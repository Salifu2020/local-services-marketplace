# Stripe Backend Setup Guide

**Choose one:** Firebase Cloud Functions (Recommended) or Express API Server

---

## 🎯 Option 1: Firebase Cloud Functions (Recommended)

### Why Firebase Functions?
- ✅ Already using Firebase
- ✅ Integrated with Firestore
- ✅ Serverless (no server to manage)
- ✅ Automatic scaling
- ✅ Free tier available

### Setup Steps

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Initialize Functions
```bash
firebase init functions
```
- Select existing project
- Choose JavaScript
- Install dependencies: Yes

#### 3. Install Dependencies
```bash
cd functions
npm install
```

#### 4. Set Stripe Secret Key
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
```

#### 5. Set App ID (if needed)
```bash
firebase functions:config:set app.id="your-app-id"
```

#### 6. Deploy Functions
```bash
firebase deploy --only functions
```

#### 7. Get Function URLs
After deployment, you'll get URLs like:
- `https://us-central1-your-project.cloudfunctions.net/createPaymentIntent`
- `https://us-central1-your-project.cloudfunctions.net/stripeWebhook`

### Update Frontend

In `src/utils/payment.js`, update `createPaymentIntent`:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

export async function createPaymentIntent(amount, currency = 'usd', bookingId) {
  const app = getApp();
  const functions = getFunctions(app);
  const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
  
  const result = await createPaymentIntentFn({
    amount,
    currency,
    bookingId,
  });
  
  return result.data.clientSecret;
}
```

### Webhook Setup

1. **Get Webhook Secret:**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://us-central1-your-project.cloudfunctions.net/stripeWebhook`
   - Copy webhook signing secret

2. **Set Webhook Secret:**
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

3. **Redeploy:**
   ```bash
   firebase deploy --only functions
   ```

---

## 🎯 Option 2: Express API Server

### Why Express API?
- ✅ More control
- ✅ Easier to debug
- ✅ Can deploy anywhere (Heroku, Railway, etc.)
- ✅ Not tied to Firebase

### Setup Steps

#### 1. Install Dependencies
```bash
cd server
npm install
```

#### 2. Create .env File
```bash
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3000
```

#### 3. Run Server
```bash
npm start
# or for development:
npm run dev
```

#### 4. Deploy to Hosting

**Heroku:**
```bash
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_test_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
git push heroku main
```

**Railway:**
- Connect GitHub repo
- Add environment variables
- Deploy automatically

**Vercel:**
- Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    }
  ]
}
```

### Update Frontend

In `src/utils/payment.js`, update `createPaymentIntent`:

```javascript
export async function createPaymentIntent(amount, currency = 'usd', bookingId) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const response = await fetch(`${API_URL}/api/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      bookingId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  const { clientSecret } = await response.json();
  return clientSecret;
}
```

Add to `.env`:
```
VITE_API_URL=https://your-api-url.com
```

### Webhook Setup

1. **Deploy server** (Heroku, Railway, etc.)

2. **Add webhook in Stripe:**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-api-url.com/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret

3. **Set webhook secret:**
   - Add to environment variables: `STRIPE_WEBHOOK_SECRET`

---

## 🔧 Configuration

### Environment Variables Needed

**Firebase Functions:**
- `stripe.secret_key` - Stripe secret key
- `stripe.webhook_secret` - Webhook signing secret
- `app.id` - Your app ID (optional)

**Express API:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `PORT` - Server port (default: 3000)

---

## 🧪 Testing

### Test Payment Intent Creation

**Firebase Functions:**
```javascript
// In browser console or test script
const functions = getFunctions();
const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
const result = await createPaymentIntent({
  amount: 50,
  currency: 'usd',
  bookingId: 'test-booking-id',
});
console.log(result.data.clientSecret);
```

**Express API:**
```bash
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "currency": "usd", "bookingId": "test-123"}'
```

### Test Webhook

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/webhook
stripe trigger payment_intent.succeeded
```

---

## 📊 Webhook Events

The backend handles:
- `payment_intent.succeeded` - Updates booking to "Paid"
- `payment_intent.payment_failed` - Updates booking to "Payment Failed"

---

## ✅ Checklist

### Firebase Functions:
- [ ] Firebase CLI installed
- [ ] Functions initialized
- [ ] Dependencies installed
- [ ] Stripe secret key configured
- [ ] Functions deployed
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook secret configured
- [ ] Frontend updated to use functions

### Express API:
- [ ] Dependencies installed
- [ ] .env file created
- [ ] Stripe keys configured
- [ ] Server running
- [ ] Deployed to hosting
- [ ] Webhook endpoint configured
- [ ] Frontend updated to use API

---

## 🚀 Quick Start (Firebase Functions)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (if not done)
firebase init functions

# 4. Install dependencies
cd functions && npm install

# 5. Set config
firebase functions:config:set stripe.secret_key="sk_test_..."

# 6. Deploy
firebase deploy --only functions
```

---

## 🚀 Quick Start (Express API)

```bash
# 1. Install dependencies
cd server && npm install

# 2. Create .env
cp .env.example .env
# Edit .env with your keys

# 3. Run
npm start

# 4. Deploy (example: Heroku)
heroku create
heroku config:set STRIPE_SECRET_KEY=sk_test_...
git push heroku main
```

---

**Choose your option and follow the setup steps!** 🚀
