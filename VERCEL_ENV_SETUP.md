# Vercel Environment Variables Setup

## ⚠️ CRITICAL: Set These Environment Variables

Your Firebase config is currently hardcoded. For production, you should use environment variables.

### Required Environment Variables in Vercel:

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

2. Add these variables:

```
VITE_FIREBASE_API_KEY=AIzaSyBtm0d4kT1KPKQWyoQGzo9yAPTAPM_0LNY
VITE_FIREBASE_AUTH_DOMAIN=neighborly-52673.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=neighborly-52673
VITE_FIREBASE_STORAGE_BUCKET=neighborly-52673.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=530737726016
VITE_FIREBASE_APP_ID=1:530737726016:web:2ddee802c22c31c1d055a5
VITE_APP_ID=1:530737726016:web:2ddee802c22c31c1d055a5
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### How to Add:

1. Go to Vercel Dashboard
2. Select your project: `local-services-marketplac`
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable:
   - **Key:** `VITE_FIREBASE_API_KEY`
   - **Value:** `AIzaSyBtm0d4kT1KPKQWyoQGzo9yAPTAPM_0LNY`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. Repeat for all variables

### After Adding Variables:

1. **Redeploy** your app:
   - Go to **Deployments** tab
   - Click the **3 dots** on latest deployment
   - Click **Redeploy**

OR

2. **Push a new commit** to trigger auto-deploy

---

## 🔍 Verify Environment Variables

After redeploying, check:
1. Visit your live site
2. Open browser console (F12)
3. Check for any Firebase initialization errors
4. Test authentication - should work automatically

---

## 📝 Note

Currently, your `firebase.js` has hardcoded values, so the app should work even without environment variables. However, for security best practices, you should:

1. Move to environment variables (optional but recommended)
2. Or keep hardcoded for now (works but less secure)

---

**Current Status:** App should work with hardcoded config ✅

