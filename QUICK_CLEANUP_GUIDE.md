# Quick Console.log Cleanup Guide

## PowerShell Command to Find All Console.log

```powershell
Get-ChildItem -Path src -Recurse -Include *.js,*.jsx | Select-String -Pattern "console\.log"
```

## Status

✅ **Cleaned:**
- `src/App.jsx` - Removed 6 console.log statements
- `src/ProOnboarding.jsx` - Removed 8 console.log statements

⏳ **Remaining (89 statements):**
- `src/pages/ProfessionalDetails.jsx` - 7 statements
- `src/pages/MyBookings.jsx` - 4 statements
- `src/pages/ProDashboard.jsx` - 4 statements
- `src/pages/BookingPage.jsx` - 5 statements
- `src/pages/ChatPage.jsx` - 1 statement
- `src/pages/MyMessages.jsx` - 3 statements
- `src/components/AvailabilitySchedule.jsx` - 8 statements
- `src/components/NotificationBell.jsx` - 3 statements
- `src/utils/notifications.js` - 1 statement
- `src/sentry.js` - 3 statements (these are OK - for Sentry initialization)

## Quick Cleanup Options

### Option 1: Manual Cleanup (Recommended)
Use Find & Replace in your IDE:
- **Find:** `console.log(`
- **Replace:** (empty or comment out)
- **Keep:** `console.error(` statements

### Option 2: Use IDE Find & Replace
Most IDEs support regex find/replace:
- **Find:** `console\.log\([^)]*\);?\n?`
- **Replace:** (empty)

### Option 3: Keep Development Logs
Wrap in environment check:
```javascript
// Replace:
console.log('Debug info:', data);

// With:
if (import.meta.env.MODE === 'development') {
  console.log('Debug info:', data);
}
```

## Files to Clean Next

Priority order:
1. `src/pages/ProfessionalDetails.jsx`
2. `src/pages/ProDashboard.jsx`
3. `src/pages/MyBookings.jsx`
4. `src/pages/BookingPage.jsx`
5. `src/components/AvailabilitySchedule.jsx`
6. `src/pages/MyMessages.jsx`
7. `src/components/NotificationBell.jsx`
8. `src/utils/notifications.js`

## What to Keep

✅ **Keep:**
- `console.error()` - For critical errors
- Sentry initialization logs (in sentry.js)
- Error logging in catch blocks

❌ **Remove:**
- Debug logs
- User ID logging
- Firestore path logging
- Data logging
- "Setting up listener" messages
- "Loaded X items" messages

## Progress

- **Total:** 97 console.log statements
- **Cleaned:** 14 statements (14%)
- **Remaining:** 83 statements (86%)

---

**Next:** Continue cleaning remaining files or use IDE find/replace for bulk removal.

