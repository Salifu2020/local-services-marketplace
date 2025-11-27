# Sentry Error Monitoring Setup Guide

## ✅ Step 1: Install Sentry Packages

Run this command in your terminal:

```bash
npm install --save @sentry/react
```

**Note:** The `@sentry/tracing` package is no longer needed for React - it's included in `@sentry/react`.

## ✅ Step 2: Create Sentry Account & Project

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or log in if you already have one)
3. Create a new project:
   - Select **React** as your platform
   - Give it a name (e.g., "Customer Portal")
   - Click "Create Project"

## ✅ Step 3: Get Your DSN

After creating the project, Sentry will show you a **DSN** (Data Source Name). It looks like:
```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx
```

Copy this DSN - you'll need it in the next step.

## ✅ Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   (Or create `.env` manually)

2. Open `.env` and add your Sentry DSN:
   ```
   VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx
   VITE_APP_VERSION=1.0.0
   ```

## ✅ Step 5: Verify Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Check the browser console - you should see:
   ```
   Sentry initialized successfully
   ```

3. Test error tracking:
   - Option A: Add the test button component to your app:
     ```jsx
     import SentryTestButton from './components/SentryTestButton';
     // Add <SentryTestButton /> to any page
     ```
     Then click the "Break the world" button to trigger a test error.
   - Option B: Open browser console and trigger an error manually
   - Check your Sentry dashboard - the error should appear within seconds

## 🎯 What Sentry Tracks

- **Unhandled Errors**: JavaScript exceptions, React errors
- **Unhandled Promise Rejections**: Async errors
- **Performance**: Page load times, API calls
- **User Context**: User ID, email (if available)
- **Environment**: Development vs Production

## 🔧 Configuration

Sentry is already configured in `src/sentry.js` with:
- ✅ Error filtering (ignores network errors, permission errors)
- ✅ Performance monitoring (BrowserTracing)
- ✅ User context tracking
- ✅ Environment detection (dev vs prod)

## 📊 Viewing Errors

1. Go to [https://sentry.io](https://sentry.io)
2. Select your project
3. Navigate to "Issues" to see all errors
4. Click on an error to see:
   - Stack trace
   - User information
   - Browser/device info
   - Breadcrumbs (user actions before error)

## 💡 Pro Tips

1. **Free Tier**: Sentry free tier includes 5,000 errors/month - perfect for getting started
2. **Filtering**: Errors are filtered in `src/sentry.js` to avoid noise (network errors, etc.)
3. **Development**: Errors are logged to console in dev mode
4. **Production**: Set `VITE_SENTRY_DSN` in your production environment variables

## 🚨 Troubleshooting

**Sentry not initializing?**
- Check that `.env` file exists and has `VITE_SENTRY_DSN` set
- Verify packages are installed: `npm list @sentry/react @sentry/tracing`
- Check browser console for errors

**Errors not appearing in Sentry?**
- Verify DSN is correct (no extra spaces)
- Check Sentry dashboard → Settings → Client Keys
- Ensure you're not blocking Sentry in ad blockers

**Too many errors?**
- Adjust filtering in `src/sentry.js` → `beforeSend()` function
- Reduce `tracesSampleRate` for performance monitoring

## ✅ Next Steps

Once Sentry is set up:
1. Deploy to production
2. Monitor errors in real-time
3. Set up alerts for critical errors
4. Track error trends over time

---

**Need Help?** Check [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)

