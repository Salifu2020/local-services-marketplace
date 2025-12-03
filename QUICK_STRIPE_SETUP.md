# Quick Stripe Backend Setup

## 🚀 Fastest Path: Firebase Cloud Functions

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Functions
```bash
firebase init functions
```
- Select your Firebase project
- Choose JavaScript
- Install dependencies: Yes

### 3. Copy Function Code
The function code is already in `functions/index.js` - just verify it's there.

### 4. Install Dependencies
```bash
cd functions
npm install stripe firebase-admin firebase-functions cors
```

### 5. Set Stripe Secret Key
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
firebase functions:config:set app.id="your_app_id"
```

### 6. Deploy
```bash
firebase deploy --only functions
```

### 7. Update Frontend
Add to `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_USE_FIREBASE_FUNCTIONS=true
```

### 8. Set Up Webhook
1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://us-central1-PROJECT.cloudfunctions.net/stripeWebhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase deploy --only functions
   ```

**Done!** Your backend is ready. 🎉

---

## Alternative: Express API (If you prefer)

### 1. Set Up Server
```bash
cd server
npm install
```

### 2. Create `.env`
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3000
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Deploy
- Heroku: `heroku create && git push heroku main`
- Railway: Connect repo and deploy
- Render: Create web service and deploy

### 5. Update Frontend
```env
VITE_USE_FIREBASE_FUNCTIONS=false
VITE_PAYMENT_API_URL=https://your-api.com
```

---

## Test It

1. Complete a booking
2. Click "Pay Now"
3. Use test card: `4242 4242 4242 4242`
4. Payment should work!

---

**Choose Firebase Functions for fastest setup!** ⚡

