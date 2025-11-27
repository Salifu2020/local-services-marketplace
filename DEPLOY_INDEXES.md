# Deploy Firestore Indexes - Step by Step Guide

## Quick Deploy Command

Once you're authenticated with Firebase CLI, run:

```bash
firebase deploy --only firestore:indexes
```

---

## Step-by-Step Instructions

### Step 1: Verify Firebase CLI is Installed

```bash
firebase --version
```

If not installed:
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

Follow the authentication flow in your browser.

### Step 3: Set Firebase Project

```bash
firebase use neighborly-52673
```

Or if you need to add the project:
```bash
firebase use --add
# Select: neighborly-52673
```

### Step 4: Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### Step 5: Verify Deployment

You should see output like:
```
✔  firestore: deployed indexes in firestore.indexes.json successfully
```

---

## What Gets Deployed

The following 3 indexes will be created:

1. **bookings** collection:
   - `professionalId` (Ascending) + `date` (Descending)

2. **bookings** collection:
   - `userId` (Ascending) + `date` (Descending)

3. **chats** collection:
   - `participants` (Array Contains) + `updatedAt` (Descending)

---

## Index Building Time

- **Small datasets:** Usually instant
- **Medium datasets:** 1-5 minutes
- **Large datasets:** 5-30 minutes

You'll receive an email when each index is ready.

---

## Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Navigate to **Firestore Database** → **Indexes**
4. You should see all 3 indexes listed
5. Status will show "Building" then "Enabled" when ready

---

## Troubleshooting

### Error: "No project active"
```bash
firebase use neighborly-52673
```

### Error: "Not authenticated"
```bash
firebase login
```

### Error: "firestore.indexes.json not found"
Make sure `firestore.indexes.json` is in the project root directory.

### Indexes not showing up
- Wait a few minutes for indexes to build
- Check Firebase Console → Firestore → Indexes
- Verify the indexes are in "Building" or "Enabled" state

---

## Alternative: Create Indexes Manually

If CLI deployment doesn't work, you can create indexes manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index** for each:

**Index 1:**
- Collection ID: `bookings`
- Fields:
  - `professionalId` - Ascending
  - `date` - Descending

**Index 2:**
- Collection ID: `bookings`
- Fields:
  - `userId` - Ascending
  - `date` - Descending

**Index 3:**
- Collection ID: `chats`
- Fields:
  - `participants` - Array
  - `updatedAt` - Descending

---

**Ready to deploy?** Run: `firebase deploy --only firestore:indexes`

