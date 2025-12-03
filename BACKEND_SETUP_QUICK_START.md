# Backend Setup - Quick Start

## 🎯 Choose Your Backend

### Option A: Firebase Cloud Functions (Recommended) ⭐
**Best if:** You're already using Firebase

**Pros:**
- ✅ Integrated with Firestore
- ✅ No server to manage
- ✅ Automatic scaling
- ✅ Free tier

**Setup Time:** 10-15 minutes

---

### Option B: Express API Server
**Best if:** You want more control or aren't using Firebase

**Pros:**
- ✅ More flexible
- ✅ Easier debugging
- ✅ Can deploy anywhere

**Setup Time:** 15-20 minutes

---

## 🚀 Quick Start: Firebase Functions

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize Functions
```bash
firebase init functions
```
- Select your Firebase project
- Choose JavaScript
- Install dependencies: Yes

### Step 3: Install Dependencies
```bash
cd functions
npm install
```

### Step 4: Configure Stripe
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
```

### Step 5: Deploy
```bash
firebase deploy --only functions
```

### Step 6: Update Frontend
Add to `.env`:
```
VITE_USE_FIREBASE_FUNCTIONS=true
```

**Done!** ✅

---

## 🚀 Quick Start: Express API

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Create .env
```bash
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
PORT=3000
```

### Step 3: Run Server
```bash
npm start
```

### Step 4: Deploy (Example: Heroku)
```bash
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_test_...
git push heroku main
```

### Step 5: Update Frontend
Add to `.env`:
```
VITE_API_URL=https://your-api-url.com
```

**Done!** ✅

---

## 📝 Environment Variables Summary

### Frontend (.env):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_USE_FIREBASE_FUNCTIONS=true  # OR
VITE_API_URL=https://your-api-url.com
```

### Backend:
**Firebase Functions:**
```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
```

**Express API (.env):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🧪 Test It

1. Complete a booking
2. Click "Pay Now"
3. Use test card: `4242 4242 4242 4242`
4. Payment should process!

---

**See `STRIPE_BACKEND_SETUP.md` for detailed instructions!** 🚀

