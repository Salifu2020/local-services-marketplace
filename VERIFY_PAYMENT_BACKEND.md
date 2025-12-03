# Verify Payment Backend Deployment ✅

**Status:** Backend deployed | Let's verify everything is connected

---

## ✅ Verification Checklist

### 1. **Backend API is Live**
- [ ] API URL: `https://your-api-url.com`
- [ ] Health check works: `https://your-api-url.com/health` → `{"status":"ok"}`
- [ ] Environment variables set in Railway/Heroku/Render

### 2. **Stripe Webhook Configured**
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] Events selected: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Webhook secret copied and added to backend environment variables

### 3. **Frontend Connected**
- [ ] `VITE_API_URL` set in `.env` (local) or Vercel (production)
- [ ] Frontend code using the API URL
- [ ] Payment modal loads correctly

### 4. **Payment Flow Works**
- [ ] Can create payment intent
- [ ] Card input appears
- [ ] Payment processes successfully
- [ ] Webhook receives events

---

## 🔍 Quick Tests

### Test 1: API Health
```bash
curl https://your-api-url.com/health
# Should return: {"status":"ok"}
```

### Test 2: Frontend Environment
Check browser console:
```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show your API URL
```

### Test 3: Payment Intent Creation
1. Go to "My Bookings"
2. Click "Pay Now"
3. Check browser Network tab
4. Should see request to `/api/create-payment-intent`

---

## 🐛 Common Issues

### "Failed to create payment intent"
- Check `VITE_API_URL` is set correctly
- Verify API is accessible
- Check Railway/Heroku logs

### "Webhook not working"
- Verify webhook URL is correct
- Check webhook secret is set
- Review backend logs

### "Payment succeeds but status not updated"
- Check webhook is configured
- Verify webhook handler is working
- Check Firestore security rules

---

**What's your API URL? Let's verify everything is connected!** 🔗

