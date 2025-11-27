# DevOps, Testing & Monitoring Guide

This document outlines the tools, processes, and best practices required for long-term development, testing, and monitoring of the Local Services Marketplace application.

---

## Table of Contents

1. [CI/CD Pipeline](#1-cicd-pipeline)
2. [Error Monitoring](#2-error-monitoring)
3. [Rollback Plan](#3-rollback-plan)
4. [Additional Best Practices](#4-additional-best-practices)

---

## 1. CI/CD Pipeline

### Overview

**Continuous Integration/Continuous Deployment (CI/CD)** automates the process of testing, building, and deploying code changes, ensuring that only tested, working code reaches production.

**Benefits:**
- ✅ Catch bugs before deployment
- ✅ Consistent deployment process
- ✅ Faster release cycles
- ✅ Reduced human error
- ✅ Automated testing

### Recommended Tool: GitHub Actions

**Why GitHub Actions:**
- Native GitHub integration
- Free for public repositories
- Generous free tier for private repos (2,000 minutes/month)
- Easy to configure with YAML
- Extensive marketplace of actions
- Supports multiple deployment targets

### Pipeline Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│   Code     │─────▶│   GitHub     │─────▶│   Build &   │─────▶│   Deploy    │
│   Push     │      │   Actions    │      │   Test      │      │   to Host   │
└─────────────┘      └──────────────┘      └─────────────┘      └─────────────┘
```

### Implementation: GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

# Trigger on push to main branch
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

# Environment variables (set in GitHub Secrets)
env:
  FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}

jobs:
  # Job 1: Run Tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint || echo "Linter not configured"

      - name: Run tests
        run: npm test || echo "Tests not configured"
        continue-on-error: true

      - name: Check build
        run: npm run build

  # Job 2: Deploy to Firebase Hosting
  deploy:
    name: Deploy to Firebase Hosting
    runs-on: ubuntu-latest
    needs: test
    # Only deploy on main branch (not on PRs)
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

### Alternative: Vercel Deployment

**File:** `.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test || echo "Tests not configured"

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Setup Instructions

#### Step 1: Create GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

**For Firebase Hosting:**
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT`: JSON key from Firebase Console
  - Go to Firebase Console → Project Settings → Service Accounts
  - Click "Generate new private key"
  - Copy the entire JSON content

**For Environment Variables:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Step 2: Create Workflow File

1. Create `.github/workflows/` directory in your repository
2. Add `deploy.yml` file with the workflow configuration above
3. Commit and push to trigger the workflow

#### Step 3: Verify Deployment

1. Go to **Actions** tab in GitHub
2. Watch the workflow run
3. Verify deployment in Firebase Console or Vercel dashboard

### Branch Strategy

**Recommended:**
- `main` branch: Production-ready code (auto-deploys)
- `develop` branch: Development code (optional staging deployment)
- Feature branches: `feature/feature-name` (no deployment)

**Workflow:**
```
Feature Branch → Pull Request → main → Auto Deploy
```

### Pre-Deployment Checks

The CI/CD pipeline should verify:

1. **Code Quality:**
   - Linter passes (ESLint, Prettier)
   - No TypeScript errors (if using TypeScript)
   - Code formatting is consistent

2. **Tests:**
   - Unit tests pass
   - Integration tests pass (if applicable)
   - E2E tests pass (if applicable)

3. **Build:**
   - Application builds successfully
   - No build errors or warnings
   - Bundle size within limits

4. **Security:**
   - No known vulnerabilities in dependencies
   - No exposed secrets in code
   - Security scanning (optional)

### Advanced: Multi-Environment Deployment

**Staging Environment:**
```yaml
# Deploy to staging on develop branch
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  # ... staging deployment steps
```

**Production Environment:**
```yaml
# Deploy to production on main branch
deploy-production:
  if: github.ref == 'refs/heads/main'
  # ... production deployment steps
```

---

## 2. Error Monitoring

### Overview

**Error Monitoring** tracks and reports application errors, exceptions, and performance issues in real-time, enabling rapid detection and resolution of production issues.

**Benefits:**
- ✅ Real-time error alerts
- ✅ Error context and stack traces
- ✅ User impact analysis
- ✅ Performance monitoring
- ✅ Release tracking

### Recommended Tool: Sentry

**Why Sentry:**
- Excellent React support
- Free tier: 5,000 errors/month
- Real-time error tracking
- Source map support
- Release tracking
- Performance monitoring
- User context
- Breadcrumbs (user actions before error)

### Alternative: Datadog

**Why Consider Datadog:**
- Comprehensive monitoring (errors, logs, metrics, APM)
- Better for large-scale applications
- More expensive but more features
- Good for microservices architecture

### Implementation: Sentry Integration

#### Step 1: Install Sentry

```bash
npm install @sentry/react @sentry/tracing
```

#### Step 2: Initialize Sentry

**File:** `src/sentry.js`

```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN, // Get from Sentry dashboard
    environment: import.meta.env.MODE, // 'development' or 'production'
    integrations: [
      new BrowserTracing(),
    ],
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    // Reduce in production if needed
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    
    // Set release version (from package.json or CI/CD)
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Filter out known non-critical errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry Error (dev mode):', event);
        return null; // Don't send in dev
      }
      
      // Filter out specific errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors (user offline, etc.)
        if (error?.message?.includes('NetworkError') || 
            error?.message?.includes('Failed to fetch')) {
          return null;
        }
        
        // Ignore Firebase permission errors (expected in some cases)
        if (error?.code === 'permission-denied') {
          return null;
        }
      }
      
      return event;
    },
    
    // Add user context
    initialScope: {
      tags: {
        component: 'frontend',
      },
    },
  });
}

export default initSentry;
```

#### Step 3: Integrate with React App

**File:** `src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import initSentry from './sentry';

// Initialize Sentry before rendering app
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Step 4: Wrap App with Error Boundary

**File:** `src/components/ErrorBoundary.jsx`

```javascript
import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**File:** `src/App.jsx`

```javascript
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your app components */}
    </ErrorBoundary>
  );
}
```

#### Step 5: Add User Context

**File:** `src/App.jsx` (in authentication handler)

```javascript
import * as Sentry from '@sentry/react';

// When user logs in
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      // Set user context in Sentry
      Sentry.setUser({
        id: user.uid,
        email: user.email,
        // Don't include sensitive data
      });
    } else {
      Sentry.setUser(null);
    }
  });
  
  return () => unsubscribe();
}, []);
```

#### Step 6: Manual Error Reporting

```javascript
import * as Sentry from '@sentry/react';

// Report errors manually
try {
  // Some operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'booking',
      action: 'create',
    },
    extra: {
      bookingData: bookingData, // Non-sensitive data only
    },
  });
  
  // Show user-friendly error
  showError('Failed to create booking. Please try again.');
}
```

#### Step 7: Performance Monitoring

```javascript
import * as Sentry from '@sentry/react';

// Track custom transactions
const transaction = Sentry.startTransaction({
  name: 'Search Professionals',
  op: 'search',
});

// ... perform search operation

transaction.finish();
```

### Setup Instructions

#### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Sign up for free account
3. Create a new project
4. Select **React** as the platform

#### Step 2: Get DSN

1. In Sentry dashboard, go to **Settings** → **Projects** → **Your Project**
2. Copy the **DSN** (Data Source Name)
3. Add to `.env` file:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

#### Step 3: Configure Release Tracking

**In CI/CD pipeline, add release version:**

```yaml
# In GitHub Actions workflow
- name: Set Sentry Release
  run: |
    export SENTRY_RELEASE=$(git rev-parse HEAD)
    echo "VITE_APP_VERSION=$SENTRY_RELEASE" >> $GITHUB_ENV
```

**Or use package.json version:**

```javascript
// src/sentry.js
import packageJson from '../package.json';

Sentry.init({
  // ...
  release: packageJson.version,
});
```

### Error Monitoring Best Practices

1. **Filter Non-Critical Errors:**
   - Network errors (user offline)
   - Expected permission errors
   - Third-party script errors

2. **Add Context:**
   - User ID (non-sensitive)
   - Action being performed
   - Relevant data (non-sensitive)

3. **Set Up Alerts:**
   - Email/Slack notifications for critical errors
   - Alert thresholds (e.g., >10 errors in 5 minutes)

4. **Review Regularly:**
   - Daily error review
   - Weekly error trend analysis
   - Fix high-frequency errors first

### Alternative: Datadog RUM (Real User Monitoring)

**Installation:**

```bash
npm install @datadog/browser-rum
```

**Initialization:**

```javascript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: import.meta.env.VITE_DATADOG_APP_ID,
  clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'local-services-app',
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 10,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
```

---

## 3. Rollback Plan

### Overview

**Rollback Plan** ensures the ability to quickly revert to a previous stable version when a critical bug is deployed, minimizing downtime and user impact.

**When to Rollback:**
- Critical bugs affecting core functionality
- Security vulnerabilities
- Performance degradation
- Data corruption issues
- High error rates

### Rollback Strategies

### Strategy 1: Firebase Hosting Rollback

**Firebase Hosting** maintains a history of deployments, making rollback straightforward.

#### Manual Rollback Process

**Step 1: Identify Previous Version**

1. Go to Firebase Console
2. Navigate to **Hosting** → **Releases**
3. Identify the last stable release (before the problematic deployment)
4. Note the release ID or timestamp

**Step 2: Rollback via Firebase Console**

1. In **Hosting** → **Releases**
2. Find the problematic release
3. Click **Rollback** button
4. Select the previous stable version
5. Confirm rollback

**Step 3: Verify Rollback**

1. Check the live site
2. Verify functionality is restored
3. Monitor error rates in Sentry
4. Confirm with team

#### Automated Rollback via CLI

```bash
# List recent releases
firebase hosting:channel:list

# Rollback to specific release
firebase hosting:rollback RELEASE_ID

# Or rollback to previous release
firebase hosting:rollback --only hosting
```

#### Rollback Script

**File:** `scripts/rollback.sh`

```bash
#!/bin/bash

# Rollback script for Firebase Hosting
# Usage: ./scripts/rollback.sh [release-id]

set -e

PROJECT_ID="your-firebase-project-id"
RELEASE_ID=${1:-"previous"} # Default to previous release

echo "🔄 Rolling back to release: $RELEASE_ID"

# Authenticate (if not already)
firebase login --no-localhost

# Set project
firebase use $PROJECT_ID

# Rollback
if [ "$RELEASE_ID" == "previous" ]; then
  echo "Rolling back to previous release..."
  firebase hosting:rollback
else
  echo "Rolling back to release: $RELEASE_ID"
  firebase hosting:rollback $RELEASE_ID
fi

echo "✅ Rollback complete!"
echo "🔍 Verify at: https://your-app.web.app"
```

**Make executable:**
```bash
chmod +x scripts/rollback.sh
```

### Strategy 2: Git-Based Rollback

**Process:**

1. **Revert Code:**
   ```bash
   # Create revert commit
   git revert HEAD
   
   # Or reset to previous commit (destructive)
   git reset --hard HEAD~1
   ```

2. **Push to Trigger CI/CD:**
   ```bash
   git push origin main
   ```

3. **CI/CD Pipeline:**
   - Automatically builds and deploys reverted code
   - No manual intervention needed

**GitHub Actions Workflow Addition:**

```yaml
# Add rollback job (manual trigger)
rollback:
  name: Rollback Deployment
  runs-on: ubuntu-latest
  if: github.event_name == 'workflow_dispatch'
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v3
      with:
        ref: ${{ github.event.inputs.commit_sha }}

    - name: Deploy previous version
      # ... deployment steps
```

### Strategy 3: Feature Flags (Preventive)

**Use feature flags to enable/disable features without deployment:**

**Install:**
```bash
npm install @unleash/proxy-client-react
```

**Implementation:**

```javascript
// src/features/featureFlags.js
import { UnleashClient } from '@unleash/proxy-client-react';

const unleash = new UnleashClient({
  url: 'https://your-unleash-instance.com/api/frontend',
  clientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY,
  appName: 'local-services-app',
});

// Check feature flag
if (unleash.isEnabled('new-booking-flow')) {
  // Use new feature
} else {
  // Use old feature
}
```

**Benefits:**
- Disable problematic features instantly
- No deployment needed
- Gradual rollout capability
- A/B testing

### Rollback Decision Matrix

| Issue Severity | Impact | Rollback Method | Time to Rollback |
|---------------|--------|------------------|------------------|
| **Critical** (App down, data loss) | High | Immediate Firebase rollback | < 5 minutes |
| **High** (Core feature broken) | Medium | Firebase rollback or Git revert | < 15 minutes |
| **Medium** (Minor feature broken) | Low | Git revert + redeploy | < 30 minutes |
| **Low** (Cosmetic issue) | Minimal | Hotfix branch | Next release |

### Rollback Checklist

**Before Rollback:**
- [ ] Confirm issue severity and impact
- [ ] Identify the problematic commit/release
- [ ] Notify team of rollback plan
- [ ] Document the issue for post-mortem

**During Rollback:**
- [ ] Execute rollback procedure
- [ ] Verify rollback success
- [ ] Test critical user flows
- [ ] Monitor error rates

**After Rollback:**
- [ ] Document rollback in incident log
- [ ] Create post-mortem report
- [ ] Fix issue in development
- [ ] Test fix thoroughly
- [ ] Plan re-deployment

### Post-Rollback Process

1. **Immediate Actions:**
   - Verify site is functional
   - Monitor error rates
   - Notify stakeholders

2. **Investigation:**
   - Identify root cause
   - Review deployment logs
   - Check CI/CD pipeline

3. **Fix Development:**
   - Create fix in feature branch
   - Test thoroughly
   - Code review

4. **Re-Deployment:**
   - Merge fix to main
   - Monitor deployment
   - Verify fix works

5. **Post-Mortem:**
   - Document incident
   - Identify improvements
   - Update processes

### Automated Rollback (Advanced)

**Set up automated rollback based on error thresholds:**

```yaml
# GitHub Actions workflow addition
monitor:
  name: Monitor Deployment
  runs-on: ubuntu-latest
  needs: deploy
  
  steps:
    - name: Check Error Rate
      run: |
        ERROR_RATE=$(curl -s "https://api.sentry.io/api/0/projects/$SENTRY_PROJECT/stats/?stat=received" | jq '.[0][1]')
        
        if [ "$ERROR_RATE" -gt 100 ]; then
          echo "High error rate detected. Triggering rollback..."
          # Trigger rollback workflow
          gh workflow run rollback.yml
        fi
```

---

## 4. Additional Best Practices

### 4.1 Testing Strategy

**Unit Tests:**
- Test individual components and functions
- Use Jest + React Testing Library
- Target: 70-80% code coverage

**Integration Tests:**
- Test component interactions
- Test API integrations
- Use React Testing Library

**E2E Tests:**
- Test complete user flows
- Use Playwright or Cypress
- Test critical paths (booking, search)

**Test Automation:**
```yaml
# Add to CI/CD pipeline
test:
  runs-on: ubuntu-latest
  steps:
    - name: Run unit tests
      run: npm test -- --coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
```

### 4.2 Code Quality

**Linting:**
- ESLint for JavaScript/React
- Prettier for code formatting
- Run in CI/CD pipeline

**Type Safety:**
- TypeScript (if using)
- PropTypes for React components
- Type checking in CI/CD

**Code Review:**
- Require PR reviews before merge
- Automated checks must pass
- Manual review for complex changes

### 4.3 Performance Monitoring

**Web Vitals:**
- Track Core Web Vitals (LCP, FID, CLS)
- Use Google Analytics or Sentry
- Set performance budgets

**Bundle Size:**
- Monitor bundle size in CI/CD
- Alert on size increases
- Use bundle analyzer

### 4.4 Security

**Dependency Scanning:**
- Use `npm audit` in CI/CD
- Automatically update dependencies
- Alert on vulnerabilities

**Secrets Management:**
- Never commit secrets
- Use GitHub Secrets
- Rotate secrets regularly

**Security Headers:**
- Configure security headers in hosting
- Use HTTPS only
- Content Security Policy (CSP)

### 4.5 Documentation

**Keep Updated:**
- README.md
- API documentation
- Deployment guides
- Incident runbooks

**Version Control:**
- Document changes in CHANGELOG.md
- Tag releases with semantic versioning
- Maintain deployment notes

---

## 5. Quick Reference

### Deployment Commands

```bash
# Manual deployment
npm run build
firebase deploy --only hosting

# Rollback
firebase hosting:rollback

# Check releases
firebase hosting:channel:list
```

### Monitoring URLs

- **Sentry Dashboard:** https://sentry.io/organizations/your-org/projects/
- **Firebase Console:** https://console.firebase.google.com/
- **GitHub Actions:** https://github.com/your-org/your-repo/actions

### Emergency Contacts

- **On-Call Engineer:** [Contact Info]
- **DevOps Lead:** [Contact Info]
- **Product Manager:** [Contact Info]

---

**Last Updated:** 2024  
**Version:** 1.0

