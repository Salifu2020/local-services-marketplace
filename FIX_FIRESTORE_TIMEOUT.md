# Fix: Firestore Save Timeout

## The Problem

The form is timing out after 5-10 seconds when trying to save. This means Firestore is not responding or is blocking the write.

## Most Common Cause: Security Rules

Firestore security rules are likely blocking the write operation.

## Quick Fix (3 Steps)

### Step 1: Enable Firestore (if not done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Click **Firestore Database** in left menu
4. If you see "Create database":
   - Click it
   - Choose **"Start in test mode"** (for development)
   - Select location
   - Click **Enable**

### Step 2: Update Security Rules

1. In Firestore Database, click **Rules** tab
2. **Replace ALL rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow writes to the nested artifacts path
    match /artifacts/{appId}/public/data/professionals/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fallback: Allow all authenticated writes for testing
    // ⚠️ REMOVE THIS IN PRODUCTION!
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### Step 3: Test Again

1. Refresh your app
2. Fill out the form
3. Should save quickly now!

## Verify It's Working

After updating rules, check browser console:
- Should see: "✅ Save completed successfully in XXXms"
- Should NOT see: "permission-denied" or timeout errors

## Alternative: Test with Simpler Path

If the nested path still doesn't work, we can test with a simpler path:

```javascript
// Simpler test path
const testRef = doc(db, 'professionals', userId);
await setDoc(testRef, professionalData);
```

Then update security rules to:
```javascript
match /professionals/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Still Not Working?

Check browser console for:
1. **"permission-denied"** → Security rules issue
2. **"unavailable"** → Firestore not enabled or network issue
3. **Timeout** → Rules blocking or Firestore not responding

Share the exact error message from console and I can help fix it!

