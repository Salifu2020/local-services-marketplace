# Firestore Save Troubleshooting

## Issue: Form Taking Forever to Save

### Possible Causes

1. **Firestore Security Rules** - Most common issue
2. **Network/Connection Problems**
3. **Incorrect Firestore Path**
4. **Firestore Not Enabled**

## Quick Fixes

### 1. Check Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules

**Temporary rule for testing (NOT for production):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/professionals/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Or allow all writes for testing:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Enable Firestore Database

1. Go to Firebase Console
2. Click "Firestore Database" in left menu
3. Click "Create database"
4. Choose "Start in test mode" (for development)
5. Select location
6. Click "Enable"

### 3. Check Browser Console

Open browser console (F12) and look for:
- Error messages
- "Saving professional profile..." log
- "Firestore path:" log
- Any permission errors

### 4. Verify Firestore Path

The path should be:
```
artifacts/{appId}/public/data/professionals/{userId}
```

Check console logs to verify the path is correct.

### 5. Test Firestore Connection

Add this to browser console:
```javascript
import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Test read
getDocs(collection(db, 'test')).then(() => {
  console.log('Firestore connection works!');
}).catch(err => {
  console.error('Firestore error:', err);
});
```

## Common Errors

### "permission-denied"
→ Fix: Update Firestore security rules (see above)

### "unavailable"
→ Fix: Check internet connection, verify Firestore is enabled

### "not-found"
→ Fix: Firestore database not created yet

### Timeout
→ Fix: Check network, verify Firestore is enabled

## Debug Steps

1. **Check console logs** - Look for error messages
2. **Verify Firestore is enabled** - Firebase Console → Firestore Database
3. **Check security rules** - Must allow writes for authenticated users
4. **Test with simpler path** - Try saving to a test collection first
5. **Check network tab** - See if request is being sent

## Alternative: Test with Simpler Path

If the nested path doesn't work, you can test with a simpler path first:

```javascript
// Test path
const testRef = doc(db, 'professionals', userId);
await setDoc(testRef, professionalData);
```

Then update security rules to match.

