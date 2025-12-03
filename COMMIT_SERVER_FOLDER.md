# Commit Server Folder to Git

**Issue:** Railway can't find `server` folder because it's not in Git

**Solution:** Commit and push the server folder to GitHub

---

## ✅ Quick Fix Steps

### Step 1: Add Server Folder to Git
```bash
git add server/
```

### Step 2: Commit
```bash
git commit -m "Add payment API server"
```

### Step 3: Push to GitHub
```bash
git push origin main
```

### Step 4: Railway Will Auto-Deploy
- Railway will detect the new `server` folder
- It will automatically redeploy
- Wait 1-2 minutes for deployment

---

## 🔍 Verify Files Are Added

Check what's being added:
```bash
git status server/
```

Should show files like:
- `server/server.js`
- `server/package.json`
- `server/README.md`

---

## ⚠️ Important: Don't Commit node_modules

Make sure `server/.gitignore` exists and excludes `node_modules`:
```
node_modules/
.env
*.log
```

---

**After pushing, Railway will be able to find the `server` folder!** 🚀

