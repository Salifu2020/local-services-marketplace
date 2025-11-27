# Firebase Setup Guide

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" → Web (</>) icon
7. Copy the `firebaseConfig` object

## Step 2: Update src/firebase.js

Replace the placeholder config in `src/firebase.js` with your actual Firebase configuration.

## Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Anonymous" authentication:
   - Click on "Anonymous"
   - Toggle it ON
   - Click "Save"

4. (Optional) If using custom tokens, enable the authentication method you need

## Step 4: Test the Connection

Run the app and check the browser console for authentication messages.

