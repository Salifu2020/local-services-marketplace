# Mobile Testing Guide

## 📱 Testing Checklist

### Step 1: Browser DevTools Testing

1. **Open Chrome DevTools** (F12)
2. **Toggle Device Toolbar** (Ctrl+Shift+M)
3. **Test these viewport sizes:**
   - iPhone SE (375px)
   - iPhone 12/13 (390px)
   - iPhone 14 Pro Max (430px)
   - Samsung Galaxy S20 (360px)
   - iPad (768px)
   - iPad Pro (1024px)

### Step 2: Real Device Testing

Test on actual devices:
- [ ] iPhone (Safari)
- [ ] Android phone (Chrome)
- [ ] Tablet (iPad/Android)

---

## 🔍 What to Test

### Navigation Bar
- [ ] All links are visible/accessible
- [ ] Links don't overflow
- [ ] Text is readable
- [ ] Touch targets are large enough (min 44x44px)
- [ ] Hamburger menu works (if implemented)

### Home Page
- [ ] Search bar is usable
- [ ] Input fields are large enough
- [ ] Buttons are tappable
- [ ] Professional cards stack vertically
- [ ] Text is readable
- [ ] No horizontal scrolling

### Forms
- [ ] Input fields are large enough
- [ ] Keyboard doesn't cover inputs
- [ ] Submit buttons are accessible
- [ ] Validation messages are visible
- [ ] Dropdowns work on mobile

### Modals/Dropdowns
- [ ] Notification dropdown works
- [ ] Modals are centered
- [ ] Can close modals easily
- [ ] Content doesn't overflow viewport

### Chat/Messaging
- [ ] Messages are readable
- [ ] Input field is accessible
- [ ] Send button is tappable
- [ ] Keyboard doesn't cover input

### Tables/Lists
- [ ] Content is readable
- [ ] No horizontal scrolling
- [ ] Buttons are accessible

---

## 🐛 Common Mobile Issues to Check

1. **Text too small** - Should be at least 16px
2. **Buttons too small** - Should be at least 44x44px
3. **Horizontal scrolling** - Should not happen
4. **Keyboard covers inputs** - Should scroll into view
5. **Touch targets too close** - Should have spacing
6. **Navigation overflow** - Should use hamburger menu
7. **Images too large** - Should be optimized
8. **Forms not usable** - Should be mobile-friendly

---

## 📋 Issues Found

Document any issues you find:

### Critical Issues
1. 
2. 
3. 

### Medium Priority
1. 
2. 
3. 

### Low Priority
1. 
2. 
3. 

---

**Test Date:** _______________  
**Tested By:** _______________

