# Quick Firebase Setup

## Step-by-Step Instructions

### 1. Get Your Firebase Config (2 minutes)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create or Select Project:**
   - Click "Add project" (or select existing)
   - Follow the setup wizard
   - Wait for project creation (30 seconds)

3. **Add Web App:**
   - Click the Web icon `</>` (or gear icon → Project settings)
   - Register app with nickname: "Customer Portal"
   - Copy the `firebaseConfig` object

4. **Enable Anonymous Authentication:**
   - Go to: Authentication → Get started
   - Click on "Anonymous" tab
   - Toggle it ON
   - Click "Save"

### 2. Update src/firebase.js

Open `src/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Your actual API key
  authDomain: "xxx.firebaseapp.com",  // ← Your project domain
  projectId: "your-project-id",      // ← Your project ID
  storageBucket: "xxx.appspot.com",    // ← Your storage bucket
  messagingSenderId: "123456789",      // ← Your sender ID
  appId: "1:123:web:abc"              // ← Your app ID
};
```

### 3. Test It

```bash
npm install
npm run dev
```

Open browser console - you should see:
- "Signed in anonymously" or "Signed in with custom token"
- "User authenticated: [user-id]"

## Troubleshooting

**Error: "Firebase: Error (auth/invalid-api-key)"**
- Double-check your `apiKey` in firebase.js
- Make sure you copied the entire key

**Error: "Firebase: Error (auth/operation-not-allowed)"**
- Go to Firebase Console → Authentication → Sign-in method
- Enable "Anonymous" authentication

**No user authenticated**
- Check browser console for errors
- Verify Firebase config is correct
- Make sure Anonymous auth is enabled

## Example Config Format

Your config should look like this (with your actual values):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "my-project-12345.firebaseapp.com",
  projectId: "my-project-12345",
  storageBucket: "my-project-12345.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:abcdef1234567890"
};
```

