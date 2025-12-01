# Stripe Payment API Server

Express API server for processing Stripe payments.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Stripe keys.

3. **Run server:**
   ```bash
   npm start        # Production
   npm run dev      # Development (with nodemon)
   ```

## Environment Variables

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (from Stripe Dashboard)
- `PORT` - Server port (default: 3000)
- `FIREBASE_APP_ID` - Your Firebase app ID (optional)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (optional)

## Endpoints

### POST /api/create-payment-intent
Creates a Stripe Payment Intent.

**Request:**
```json
{
  "amount": 100.00,
  "currency": "usd",
  "bookingId": "booking123",
  "userId": "user123"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### POST /webhook
Stripe webhook endpoint for payment events.

## Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
git push heroku main
```

### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Render
1. Create new Web Service
2. Connect repo
3. Add environment variables
4. Deploy

## Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.com/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `.env`
