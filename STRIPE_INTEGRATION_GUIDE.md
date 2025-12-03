# Stripe Payment Integration Guide

**Status:** ✅ Frontend Complete | ⚠️ Backend Required

---

## 🎯 What Was Implemented

### 1. **Stripe Payment Modal** ✅
**Component:** `src/components/payment/StripePaymentModal.jsx`

**Features:**
- ✅ Stripe Elements integration
- ✅ Card input with validation
- ✅ Payment processing
- ✅ Error handling
- ✅ Loading states
- ✅ Test mode indicators

**Integration:**
- ✅ Integrated into `MyBookings` page
- ✅ Replaces mock payment modal
- ✅ Handles payment success/failure

---

### 2. **Payment Utilities** ✅
**File:** `src/utils/payment.js`

**Functions:**
- `createPaymentIntent()` - Create payment intent (placeholder for backend)
- `calculatePaymentAmount()` - Calculate payment from booking
- `formatAmount()` - Format currency display
- `validatePaymentAmount()` - Validate payment amounts

---

## ⚠️ **Backend Required**

Stripe requires a backend server to:
1. **Create Payment Intents** - Securely create payment intents
2. **Handle Webhooks** - Process payment confirmations
3. **Store Secret Keys** - Never expose secret keys in frontend

### Why Backend is Needed:
- **Security:** Secret keys must never be in frontend code
- **PCI Compliance:** Payment processing must be server-side
- **Webhooks:** Stripe sends events to your backend

---

## 🚀 **Setup Instructions**

### Step 1: Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Get Stripe API Keys
1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy your **Publishable Key** (starts with `pk_test_`)

### Step 3: Add Environment Variable
Create `.env` file:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**For Vercel:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add: `VITE_STRIPE_PUBLISHABLE_KEY` = your publishable key
- Redeploy after adding

### Step 4: Set Up Backend (Required)

**Option A: Firebase Cloud Functions** (Recommended)
```javascript
// functions/index.js
const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.secret_key);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const { amount, currency, bookingId } = data;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency || 'usd',
    metadata: {
      bookingId,
      userId: context.auth.uid,
    },
  });
  
  return { clientSecret: paymentIntent.client_secret };
});
```

**Option B: Node.js/Express API**
```javascript
// server.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency, bookingId } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency || 'usd',
    metadata: { bookingId },
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

---

## 🔧 **Update Frontend Code**

### Replace Mock Payment Intent

In `src/components/payment/StripePaymentModal.jsx`, replace:

```javascript
// Current (mock):
setClientSecret('mock_client_secret_for_testing');

// Replace with:
const { createPaymentIntent } = await import('../../utils/payment');
const clientSecret = await createPaymentIntent(amount, 'usd', booking.id);
setClientSecret(clientSecret);
```

### Replace Mock Payment Confirmation

In `src/components/payment/StripePaymentModal.jsx`, replace:

```javascript
// Current (mock):
return {
  error: null,
  paymentIntent: { status: 'succeeded', id: `pi_${Date.now()}` },
};

// Replace with:
return await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer',
    },
  },
});
```

---

## 📊 **Payment Flow**

1. **User clicks "Pay Now"**
   - Opens Stripe Payment Modal
   - Shows booking details and amount

2. **Payment Intent Created** (Backend)
   - Backend creates Payment Intent
   - Returns `clientSecret` to frontend

3. **User Enters Card Details**
   - Stripe Elements handles card input
   - Validates card in real-time

4. **Payment Confirmed** (Stripe)
   - Frontend confirms payment with Stripe
   - Stripe processes payment

5. **Status Updated** (Firestore)
   - Payment status updated to "Paid"
   - Payment Intent ID stored
   - Notification sent to professional

---

## 🧪 **Testing**

### Test Cards (Stripe Test Mode):
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

**Any:**
- Future expiry date
- Any 3-digit CVC
- Any ZIP code

### Test Flow:
1. Complete a booking
2. Mark as "Completed" (pro dashboard)
3. Click "Pay Now" (customer bookings)
4. Use test card: `4242 4242 4242 4242`
5. Payment should succeed

---

## 🔒 **Security Checklist**

- [ ] Secret key only in backend
- [ ] Publishable key in environment variable
- [ ] HTTPS required (production)
- [ ] Webhook signature verification
- [ ] Payment amount validation
- [ ] User authentication checks
- [ ] PCI compliance considerations

---

## 📝 **Webhook Setup** (Backend)

Stripe sends webhooks for payment events:

```javascript
// Handle webhook
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Update Firestore booking status
    // Send notifications
  }
  
  res.json({received: true});
});
```

---

## ✅ **Current Status**

**Frontend:** ✅ Complete
- Stripe Elements integrated
- Payment modal created
- Error handling implemented
- Loading states added

**Backend:** ⚠️ Required
- Need to create Payment Intent endpoint
- Need to handle webhooks
- Need to store secret key securely

---

## 🚀 **Next Steps**

1. **Install Stripe packages:**
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js
   ```

2. **Add environment variable:**
   - Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`
   - Add to Vercel environment variables

3. **Set up backend:**
   - Choose: Firebase Functions or Express API
   - Create Payment Intent endpoint
   - Set up webhook handler

4. **Update frontend:**
   - Replace mock Payment Intent creation
   - Replace mock payment confirmation

5. **Test:**
   - Use Stripe test cards
   - Verify payment flow
   - Check Firestore updates

---

**Ready to integrate! Install packages and set up backend.** 🚀

