# Stripe Payment Integration Setup

## Prerequisites

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Get your API keys from Dashboard → Developers → API keys

2. **API Keys Needed**
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`) - Keep this secret!

## Installation

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## Environment Variables

Add to `.env` file:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**For Production:**
- Add to Vercel: Settings → Environment Variables
- Use `VITE_STRIPE_PUBLISHABLE_KEY` with your live key

## Backend Setup (Required)

Stripe requires a backend to:
1. Create Payment Intents (secure)
2. Handle webhooks
3. Process payments

**Options:**
1. **Firebase Cloud Functions** (Recommended)
2. **Node.js/Express API**
3. **Stripe CLI** (for testing)

## Security Notes

- ⚠️ **Never expose secret keys in frontend**
- ✅ Use publishable key in frontend only
- ✅ Create Payment Intents on backend
- ✅ Verify webhooks on backend

---

**We'll implement the frontend first, then guide you on backend setup.**

