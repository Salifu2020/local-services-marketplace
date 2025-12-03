# Complete Stripe Integration Setup

**Status:** ✅ Frontend Ready | ⚠️ Backend Setup Required

---

## 📋 Complete Setup Checklist

### Frontend (Already Done) ✅
- [x] Stripe packages added to package.json
- [x] StripePaymentModal component created
- [x] Payment utilities created
- [x] Integrated into MyBookings page
- [x] Error handling implemented

### Backend (Choose One) ⚠️

#### Option A: Firebase Cloud Functions
- [ ] Install Firebase CLI
- [ ] Initialize functions
- [ ] Install dependencies
- [ ] Set Stripe secret key
- [ ] Deploy functions
- [ ] Configure webhook
- [ ] Update frontend env

#### Option B: Express API
- [ ] Install dependencies
- [ ] Create .env file
- [ ] Set Stripe keys
- [ ] Deploy to hosting
- [ ] Configure webhook
- [ ] Update frontend env

---

## 🎯 Step-by-Step: Firebase Functions

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Functions
```bash
cd your-project-root
firebase init functions
```
**Select:**
- Use existing project
- JavaScript
- Install dependencies: Yes

### 3. Install Dependencies
```bash
cd functions
npm install
```

### 4. Set Configuration
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
firebase functions:config:set app.id="your-app-id"  # Optional
```

### 5. Deploy
```bash
firebase deploy --only functions
```

### 6. Get Function URLs
After deployment, note the URLs:
- `createPaymentIntent`: `https://us-central1-xxx.cloudfunctions.net/createPaymentIntent`
- `stripeWebhook`: `https://us-central1-xxx.cloudfunctions.net/stripeWebhook`

### 7. Configure Webhook in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://us-central1-xxx.cloudfunctions.net/stripeWebhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook signing secret

### 8. Set Webhook Secret
```bash
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase deploy --only functions
```

### 9. Update Frontend Environment
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

## 🎯 Step-by-Step: Express API

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3000
```

### 3. Test Locally
```bash
npm start
# Server runs on http://localhost:3000
```

### 4. Deploy to Heroku
```bash
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_test_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
git add server/
git commit -m "Add payment API server"
git push heroku main
```

### 5. Configure Webhook in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app-name.herokuapp.com/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret

### 6. Update Frontend Environment
Add to `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://your-app-name.herokuapp.com
```

**For Vercel:**
- Settings → Environment Variables
- Add both variables
- Redeploy

---

## 🧪 Testing

### 1. Test Payment Intent Creation

**Firebase Functions:**
```javascript
// In browser console
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
const result = await createPaymentIntent({
  amount: 50,
  currency: 'usd',
  bookingId: 'test-123',
});
console.log(result.data);
```

**Express API:**
```bash
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "currency": "usd", "bookingId": "test-123"}'
```

### 2. Test Payment Flow
1. Complete a booking
2. Go to "My Bookings"
3. Click "Pay Now"
4. Use test card: `4242 4242 4242 4242`
5. Expiry: Any future date
6. CVC: Any 3 digits
7. Payment should succeed!

### 3. Test Webhook (Stripe CLI)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## 🔒 Security Checklist

- [ ] Secret key only in backend (never in frontend)
- [ ] Publishable key in environment variable
- [ ] Webhook signature verification enabled
- [ ] HTTPS required (production)
- [ ] Payment amount validation
- [ ] User authentication checks
- [ ] Booking ownership verification

---

## 📊 Payment Flow Diagram

```
User clicks "Pay Now"
    ↓
Frontend calls createPaymentIntent()
    ↓
Backend creates Payment Intent with Stripe
    ↓
Returns clientSecret to frontend
    ↓
User enters card details
    ↓
Frontend confirms payment with Stripe
    ↓
Stripe processes payment
    ↓
Webhook sent to backend
    ↓
Backend updates Firestore
    ↓
Notification sent to professional
```

---

## 🐛 Troubleshooting

### "Payment backend not configured"
- Check environment variables are set
- Verify backend is deployed
- Check network requests in DevTools

### "Failed to create payment intent"
- Check Stripe secret key is correct
- Verify backend is running
- Check backend logs

### "Webhook not working"
- Verify webhook URL is correct
- Check webhook secret is set
- Test with Stripe CLI

### "Payment succeeds but status not updated"
- Check webhook is configured
- Verify webhook handler is working
- Check Firestore security rules

---

## 📝 Files Created

### Backend:
- `functions/index.js` - Firebase Cloud Functions
- `functions/package.json` - Functions dependencies
- `server/server.js` - Express API server
- `server/package.json` - Server dependencies
- `server/.env.example` - Environment template

### Documentation:
- `STRIPE_BACKEND_SETUP.md` - Detailed setup guide
- `BACKEND_SETUP_QUICK_START.md` - Quick reference
- `STRIPE_COMPLETE_SETUP.md` - This file

---

## ✅ Next Steps

1. **Choose backend option** (Firebase Functions or Express API)
2. **Follow setup steps** above
3. **Test payment flow** with test cards
4. **Deploy to production**
5. **Configure webhooks**
6. **Monitor payments** in Stripe Dashboard

---

**Ready to set up! Choose your backend option and follow the steps.** 🚀

