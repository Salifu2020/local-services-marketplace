# Email & SMS Notifications Setup Guide

## Overview

ExpertNextDoor now supports email and SMS notifications for:
- Booking confirmations
- Booking reminders (24hr before)
- Payment receipts
- New messages
- Booking cancellations
- Payment reminders

## Backend Setup

### 1. Install Required Packages

In your `server/` directory, install email and SMS service packages:

```bash
cd server
npm install nodemailer @sendgrid/mail twilio
```

### 2. Environment Variables

Add to your `server/.env` file:

```env
# Email Service (Choose one: SendGrid or Nodemailer/SMTP)
SENDGRID_API_KEY=your_sendgrid_api_key_here
# OR for SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@expertnextdoor.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Update server.js

Add these endpoints to your `server/server.js`:

```javascript
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize email service (SendGrid or SMTP)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize SMS service (Twilio)
const twilioClient = process.env.TWILIO_ACCOUNT_SID 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send Email
 * POST /api/send-email
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    // Use SendGrid if available, otherwise use SMTP
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: process.env.SMTP_FROM || 'noreply@expertnextdoor.com',
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    } else if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    } else {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

/**
 * Send SMS
 * POST /api/send-sms
 */
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    if (!twilioClient) {
      return res.status(500).json({ error: 'SMS service not configured' });
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to, // E.164 format: +1234567890
    });

    res.json({ success: true, message: 'SMS sent successfully', sid: result.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS', details: error.message });
  }
});
```

## Service Provider Setup

### SendGrid (Recommended for Email)

1. Sign up at https://sendgrid.com
2. Create an API key in Settings > API Keys
3. Verify your sender email/domain
4. Add `SENDGRID_API_KEY` to your `.env`

**Free Tier:** 100 emails/day

### Twilio (SMS)

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Get a phone number (or use trial number)
4. Add credentials to your `.env`

**Free Trial:** $15.50 credit, limited to verified numbers

### Alternative: SMTP (Email)

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - User: Your Gmail address
   - Pass: App Password

## Frontend Integration

The frontend automatically:
1. Checks user notification preferences
2. Sends email/SMS when enabled
3. Falls back gracefully if services fail
4. Logs errors without breaking the app

## User Preferences

Users can control notifications in their profile settings:
- Email notifications (on/off per type)
- SMS notifications (on/off per type)

Default preferences:
- **Email:** All enabled
- **SMS:** Only critical reminders enabled

## Testing

### Test Email Endpoint

```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

### Test SMS Endpoint

```bash
curl -X POST http://localhost:3000/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test SMS from ExpertNextDoor"
  }'
```

## Notification Types

### Email Templates
- ✅ Booking Confirmation
- ⏰ Booking Reminder (24hr)
- 💰 Payment Receipt
- 💬 New Message
- ❌ Booking Cancellation

### SMS Templates
- ✅ Booking Confirmation
- ⏰ Booking Reminder (24hr)
- 💰 Payment Confirmation
- 💬 New Message
- ❌ Booking Cancellation

## Cost Considerations

### Email
- **SendGrid:** Free tier (100/day), then $19.95/month for 50k
- **SMTP:** Usually free with hosting provider

### SMS
- **Twilio:** ~$0.0075 per SMS in US
- **Cost per 1000 SMS:** ~$7.50

## Security Notes

1. Never expose API keys in frontend code
2. Always validate email/phone formats
3. Rate limit endpoints to prevent abuse
4. Log all email/SMS sends for audit
5. Handle bounces/unsubscribes properly

## Next Steps

1. Set up SendGrid or SMTP for email
2. Set up Twilio for SMS
3. Add environment variables to Railway/Vercel
4. Test notifications end-to-end
5. Monitor usage and costs

