# Set Up Firebase Project for CLI

## Quick Fix

You need to set the active Firebase project. Run one of these commands:

### Option 1: Set Project Directly
```bash
firebase use neighborly-52673
```

### Option 2: Add Project (Interactive)
```bash
firebase use --add
```
Then select `neighborly-52673` from the list.

### Option 3: Deploy with Project Flag
```bash
firebase deploy --only firestore:indexes --project neighborly-52673
```

---

## Step-by-Step

### Step 1: List Available Projects
```bash
firebase projects:list
```
This shows all Firebase projects you have access to.

### Step 2: Set Active Project
```bash
firebase use neighborly-52673
```

### Step 3: Verify Project is Set
```bash
firebase use
```
Should show: `Using project neighborly-52673`

### Step 4: Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

---

## If Project Not Found

If `neighborly-52673` doesn't appear in the list:

1. Verify you're logged in with the correct Google account:
   ```bash
   firebase login:list
   ```

2. If needed, login again:
   ```bash
   firebase login
   ```

3. Check your Firebase Console to confirm the project ID is correct.

---

## Quick Command (All in One)

```bash
firebase deploy --only firestore:indexes --project neighborly-52673
```

This bypasses the need to set an active project.

