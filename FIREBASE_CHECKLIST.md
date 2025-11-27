# Firebase Setup Checklist

## ✅ Completed
- [x] Firebase config added to `src/firebase.js`
- [x] Project: neighborly-52673
- [x] Analytics configured

## ⚠️ Required: Enable Anonymous Authentication

**You MUST do this for the app to work:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Click **Authentication** in the left menu
4. Click **Get started** (if first time)
5. Click on the **Sign-in method** tab
6. Find **Anonymous** in the list
7. Click on it
8. Toggle **Enable** to ON
9. Click **Save**

## Test the Setup

After enabling Anonymous Authentication:

```bash
npm install
npm run dev
```

Open the app and check:
- ✅ No errors in browser console
- ✅ User ID is displayed
- ✅ Loading screen disappears
- ✅ Search bar is visible

## Troubleshooting

**Error: "auth/operation-not-allowed"**
→ Anonymous authentication is not enabled. Follow steps above.

**Error: "auth/invalid-api-key"**
→ Check that the API key in firebase.js matches Firebase Console.

**No user authenticated**
→ Check browser console for errors. Make sure Anonymous auth is enabled.

