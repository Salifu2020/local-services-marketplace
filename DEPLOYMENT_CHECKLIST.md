# Pre-Deployment Checklist

This document provides a comprehensive checklist for final code review and preparation for production deployment of the Local Services Marketplace application.

---

## 1. Environment Variables & Configuration

### ✅ Firebase Configuration

- [ ] Verify `src/firebase.js` uses correct Firebase config
- [ ] Confirm `appId` is correctly extracted from Firebase config
- [ ] Check that `__initial_auth_token` is optional (falls back to anonymous auth)
- [ ] Verify no hardcoded API keys or secrets in source code
- [ ] Ensure Firebase config is environment-specific (dev/staging/prod)

**Files to Review:**
- `src/firebase.js`
- `src/App.jsx` (authentication initialization)

**Check:**
```javascript
// ✅ Good: Config from environment or Firebase config object
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your-api-key",
  // ...
};

// ❌ Bad: Hardcoded secrets
const SECRET_KEY = "hardcoded-secret-123";
```

---

## 2. Error Handling

### ✅ Firestore Operations

- [ ] All `getDoc` calls have try-catch blocks
- [ ] All `setDoc`/`updateDoc` calls have error handling
- [ ] All `addDoc` calls handle errors gracefully
- [ ] All `onSnapshot` listeners have error callbacks
- [ ] Network errors are caught and displayed to users
- [ ] Permission denied errors show user-friendly messages
- [ ] Timeout errors are handled (especially for save operations)

**Files to Review:**
- `src/ProOnboarding.jsx` - Profile saving
- `src/pages/ProfessionalDetails.jsx` - Profile fetching
- `src/pages/BookingPage.jsx` - Booking creation
- `src/pages/ProDashboard.jsx` - Booking updates
- `src/pages/ChatPage.jsx` - Message sending
- `src/pages/MyBookings.jsx` - Payment processing
- `src/components/AvailabilitySchedule.jsx` - Schedule updates
- `src/hooks/useFavorites.js` - Favorite toggling
- `src/App.jsx` - Professional fetching

**Error Handling Pattern:**
```javascript
// ✅ Good: Comprehensive error handling
try {
  await setDoc(docRef, data);
  showSuccess('Saved successfully');
} catch (error) {
  console.error('Error:', error);
  if (error.code === 'permission-denied') {
    showError('Permission denied. Please check your access.');
  } else if (error.code === 'unavailable') {
    showError('Service unavailable. Please try again.');
  } else {
    showError('Failed to save. Please try again.');
  }
}
```

---

## 3. Console.log Cleanup

### ✅ Remove Debug Logging

- [ ] Remove all `console.log` statements related to:
  - [ ] Data fetching operations
  - [ ] User IDs or sensitive information
  - [ ] Firestore paths and document IDs
  - [ ] Authentication tokens or credentials
  - [ ] API responses with user data
- [ ] Keep only essential error logging (`console.error`)
- [ ] Replace debug logs with proper error tracking (if applicable)

**Files to Review:**
- `src/App.jsx` - Search for `console.log`
- `src/ProOnboarding.jsx` - Remove save process logs
- `src/pages/ProfessionalDetails.jsx` - Remove fetch logs
- `src/pages/BookingPage.jsx` - Remove booking logs
- `src/pages/ProDashboard.jsx` - Remove booking update logs
- `src/pages/ChatPage.jsx` - Remove message logs
- `src/components/AvailabilitySchedule.jsx` - Remove schedule logs
- `src/hooks/useFavorites.js` - Remove favorite logs
- `src/context/ToastContext.jsx` - Check for logs
- `src/context/LoadingContext.jsx` - Check for logs

**Search Command:**
```bash
# Find all console.log statements
grep -r "console.log" src/
```

**Replacement Strategy:**
```javascript
// ❌ Remove:
console.log('User ID:', userId);
console.log('Firestore path:', docRef.path);
console.log('Data to save:', professionalData);

// ✅ Keep (for errors only):
console.error('Error saving profile:', error);

// ✅ Optional: Use environment-based logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

## 4. Responsive Design & Accessibility

### ✅ Responsive Breakpoints

- [ ] Test on mobile devices (320px - 768px)
- [ ] Test on tablets (768px - 1024px)
- [ ] Test on desktop (1024px+)
- [ ] Verify navigation menu works on mobile (hamburger menu if needed)
- [ ] Check that cards/grids adapt to screen size
- [ ] Ensure forms are usable on mobile
- [ ] Verify modals/dropdowns work on touch devices

**Components to Test:**
- [ ] Navigation bar (all screen sizes)
- [ ] Professional cards grid (1/2/3 columns)
- [ ] Search interface (mobile-friendly)
- [ ] Booking calendar (touch-friendly)
- [ ] Forms (ProOnboarding, Booking, Review)
- [ ] Toast notifications (mobile positioning)
- [ ] Loading overlay (mobile sizing)
- [ ] Admin dashboard (responsive tables/cards)

**Test Checklist:**
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13 (390px width)
- [ ] iPad (768px width)
- [ ] Desktop (1920px width)

---

### ✅ Accessibility (WCAG 2.1 AA Compliance)

#### Color Contrast

- [ ] Text on white background: Minimum 4.5:1 ratio
- [ ] Text on colored backgrounds: Minimum 4.5:1 ratio
- [ ] Large text (18pt+): Minimum 3:1 ratio
- [ ] Interactive elements: Clear visual focus states
- [ ] Error states: Red text meets contrast requirements

**Tools:**
- Use browser DevTools Accessibility panel
- Use online contrast checkers (WebAIM Contrast Checker)

#### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible (outline/ring)
- [ ] Modal dialogs trap focus
- [ ] Skip links for main content (if applicable)
- [ ] Form fields have proper labels
- [ ] Buttons have descriptive text or aria-labels

**Test:**
- Navigate entire app using only Tab, Enter, Space, Arrow keys
- Verify all buttons/links are reachable
- Check that modals can be closed with Escape

#### ARIA Labels & Semantic HTML

- [ ] All buttons have `aria-label` if text is not descriptive
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are associated with form fields (`aria-describedby`)
- [ ] Loading states have `aria-live` regions
- [ ] Toast notifications have `role="alert"`
- [ ] Navigation has proper `role="navigation"`
- [ ] Icons have `aria-hidden="true"` or descriptive labels

**Examples:**
```jsx
// ✅ Good: Proper ARIA labels
<button
  onClick={handleFavorite}
  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
>
  <HeartIcon aria-hidden="true" />
</button>

// ✅ Good: Form labels
<label htmlFor="email">Email Address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

#### Screen Reader Testing

- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify all content is announced correctly
- [ ] Check that form errors are announced
- [ ] Ensure navigation is logical
- [ ] Verify images have alt text (if any)

---

## 5. Performance Optimization

### ✅ Code Splitting

- [ ] Verify `React.lazy` is used for route-based code splitting
- [ ] Check that large components are lazy-loaded
- [ ] Ensure loading states are shown during code splitting

**Check:**
```javascript
// ✅ Good: Lazy loading routes
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const ProOnboarding = React.lazy(() => import('./ProOnboarding'));
```

### ✅ Image Optimization

- [ ] All images use lazy loading (`loading="lazy"`)
- [ ] Images have appropriate sizes/widths
- [ ] Use WebP format where possible
- [ ] Provide fallbacks for unsupported formats

### ✅ Bundle Size

- [ ] Run `npm run build` and check bundle size
- [ ] Verify no unnecessary dependencies
- [ ] Check for duplicate imports
- [ ] Use tree-shaking where applicable

**Command:**
```bash
npm run build
# Check dist/ folder size
# Review bundle analysis if configured
```

---

## 6. Security Review

### ✅ Authentication

- [ ] Verify anonymous authentication fallback works
- [ ] Check that custom token auth is optional
- [ ] Ensure no authentication tokens are logged
- [ ] Verify user ID is not exposed unnecessarily

### ✅ Data Validation

- [ ] Client-side validation on all forms
- [ ] Server-side validation (Firestore rules) documented
- [ ] Input sanitization (if applicable)
- [ ] XSS prevention (React handles this, but verify)

### ✅ Firestore Security Rules

- [ ] Security rules are deployed and tested
- [ ] Rules match the documented structure
- [ ] Admin access is properly restricted
- [ ] Test rules in Rules Playground

**Reference:** See `FIRESTORE_SECURITY_RULES.md`

---

## 7. Testing Checklist

### ✅ Functional Testing

- [ ] User can search for professionals
- [ ] User can view professional details
- [ ] User can favorite/unfavorite professionals
- [ ] User can create a booking
- [ ] Professional can confirm/decline bookings
- [ ] Professional can complete bookings
- [ ] User can send messages in chat
- [ ] User can submit reviews
- [ ] Professional can set availability
- [ ] Admin can access admin dashboard
- [ ] Non-admin cannot access admin dashboard

### ✅ Edge Cases

- [ ] Handle empty search results
- [ ] Handle professional not found
- [ ] Handle network errors gracefully
- [ ] Handle Firestore permission errors
- [ ] Handle missing data fields
- [ ] Handle concurrent booking requests
- [ ] Handle expired sessions

### ✅ Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 8. Documentation

### ✅ Code Documentation

- [ ] Complex functions have JSDoc comments
- [ ] Component props are documented (if using TypeScript/PropTypes)
- [ ] API functions have clear documentation
- [ ] README.md is up to date

### ✅ User Documentation

- [ ] README.md includes setup instructions
- [ ] README.md includes key features
- [ ] README.md includes technology stack
- [ ] Deployment instructions are documented

---

## 9. Environment Setup

### ✅ Development Environment

- [ ] `.env.example` file exists (if using env vars)
- [ ] Development dependencies are in `devDependencies`
- [ ] Production dependencies are in `dependencies`
- [ ] `.gitignore` excludes sensitive files

### ✅ Production Build

- [ ] `npm run build` completes without errors
- [ ] Build output is optimized
- [ ] Source maps are disabled in production (or configured)
- [ ] Environment variables are set correctly

**Build Command:**
```bash
npm run build
# Verify dist/ folder is created
# Test build locally: npm run preview
```

---

## 10. Deployment Preparation

### ✅ Pre-Deployment

- [ ] All tests pass (if applicable)
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Accessibility audit completed
- [ ] Browser testing completed

### ✅ Deployment Checklist

- [ ] Firestore indexes are created and active
- [ ] Firestore security rules are deployed
- [ ] Firebase project is configured correctly
- [ ] Environment variables are set in hosting platform
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] Analytics/tracking is configured (if applicable)

### ✅ Post-Deployment

- [ ] Verify application loads correctly
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Check Firestore usage/read counts
- [ ] Verify notifications work
- [ ] Test on multiple devices/browsers

---

## 11. Monitoring & Maintenance

### ✅ Error Tracking

- [ ] Error logging is configured (if applicable)
- [ ] Error boundaries are implemented (React)
- [ ] User-friendly error messages are displayed
- [ ] Critical errors are logged for debugging

### ✅ Performance Monitoring

- [ ] Page load times are acceptable
- [ ] Firestore read counts are monitored
- [ ] Bundle size is tracked
- [ ] User experience metrics are collected (if applicable)

---

## Quick Reference: Files to Review

### Critical Files
- `src/firebase.js` - Firebase configuration
- `src/App.jsx` - Main app, authentication, routing
- `src/ProOnboarding.jsx` - Profile creation
- `src/pages/ProfessionalDetails.jsx` - Profile display
- `src/pages/BookingPage.jsx` - Booking creation
- `src/pages/ProDashboard.jsx` - Professional dashboard
- `src/pages/ChatPage.jsx` - Messaging
- `src/pages/MyBookings.jsx` - Customer bookings
- `src/pages/MyFavorites.jsx` - Favorites list
- `src/pages/AdminDashboard.jsx` - Admin access

### Configuration Files
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Styling configuration
- `firebase.json` - Firebase configuration (if exists)
- `firestore.indexes.json` - Firestore indexes (if exists)
- `firestore.rules` - Security rules (if exists)

### Documentation Files
- `README.md` - Project documentation
- `FIRESTORE_DATA_MODEL.md` - Data structure
- `FIRESTORE_SECURITY_RULES.md` - Security rules
- `FIRESTORE_PERFORMANCE_OPTIMIZATION.md` - Performance guide

---

## Automated Checks

### Run These Commands Before Deployment

```bash
# 1. Check for console.log statements
grep -r "console.log" src/ | grep -v "console.error"

# 2. Check for hardcoded secrets (basic check)
grep -r "apiKey.*=.*['\"].*['\"]" src/

# 3. Build the project
npm run build

# 4. Check for TypeScript errors (if using TypeScript)
npm run type-check

# 5. Run linter
npm run lint

# 6. Check bundle size
npm run build && du -sh dist/
```

---

## Final Sign-Off

Before deploying to production, ensure:

- [ ] All checklist items are completed
- [ ] Code has been reviewed by at least one other person
- [ ] Security review is complete
- [ ] Performance testing is complete
- [ ] Accessibility audit is complete
- [ ] Documentation is up to date
- [ ] Backup/rollback plan is in place

---

**Last Updated:** 2024
**Version:** 1.0

