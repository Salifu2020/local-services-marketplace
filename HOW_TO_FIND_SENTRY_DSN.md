# How to Find Your Sentry DSN

## 🎯 Quick Answer

Your DSN (Data Source Name) is shown in **multiple places** in your Sentry dashboard. Here's where to find it:

---

## 📍 Method 1: After Project Creation (Easiest)

1. **Right after creating your React project** in Sentry, the DSN is displayed on the setup page
2. It's shown in the code snippet like this:
   ```javascript
   Sentry.init({
     dsn: "https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx",
     // ...
   });
   ```
3. **Copy the DSN** from that code snippet

---

## 📍 Method 2: Project Settings → Client Keys

1. Go to [https://sentry.io](https://sentry.io) and log in
2. Click on your **project name** (top left)
3. Click **Settings** (gear icon ⚙️)
4. In the left sidebar, click **Client Keys (DSN)**
5. You'll see your DSN listed there - **copy it**

---

## 📍 Method 3: Project Settings → General

1. Go to [https://sentry.io](https://sentry.io) and log in
2. Click on your **project name** (top left)
3. Click **Settings** (gear icon ⚙️)
4. Click **General** in the left sidebar
5. Scroll down to find the **DSN** section
6. **Copy the DSN** value

---

## 📍 Method 4: From the Setup Instructions

1. Go to your Sentry project dashboard
2. Look for **"Get Started"** or **"Installation"** section
3. Click on **"Configure SDK"** tab
4. The DSN is shown in the code snippet on that page

---

## 🔍 What Does a DSN Look Like?

A DSN typically looks like this:
```
https://aa9aa72e90ef425a10e519db942efb7a@04510434077966336.ingest.us.sentry.io/4510434079145984
```

It has three parts:
- **Protocol**: `https://`
- **Public Key**: The long string before the `@` symbol
- **Ingest URL**: The Sentry server address and project ID

---

## ✅ Once You Have Your DSN

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your DSN:
   ```
   VITE_SENTRY_DSN=https://your-actual-dsn-here@xxxxx.ingest.sentry.io/xxxxxxx
   ```
3. **Important**: Replace `your-actual-dsn-here` with your actual DSN from Sentry
4. Restart your dev server: `npm run dev`

---

## 🚨 Can't Find It?

If you can't find your DSN:

1. **Check you're in the right project**: Make sure you selected the correct project in Sentry
2. **Check permissions**: Make sure you have access to view project settings
3. **Create a new project**: If needed, create a new React project in Sentry and the DSN will be shown immediately

---

## 💡 Pro Tip

You can have **multiple DSNs** for different environments:
- Development: `VITE_SENTRY_DSN_DEV=...`
- Production: `VITE_SENTRY_DSN_PROD=...`

But for now, just use one DSN in your `.env` file as `VITE_SENTRY_DSN`.

---

**Need more help?** Check the [Sentry Documentation](https://docs.sentry.io/product/sentry-basics/dsn-explainer/)

