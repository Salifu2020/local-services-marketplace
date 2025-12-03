/**
 * Express API Server for Stripe Payment Processing
 * 
 * Alternative to Firebase Cloud Functions
 * 
 * Setup:
 * 1. npm install in server/ directory
 * 2. Create .env file with STRIPE_SECRET_KEY
 * 3. Run: npm start
 * 4. Deploy to Heroku, Railway, or similar
 */

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For webhooks

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Create Payment Intent
 * POST /api/create-payment-intent
 */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', bookingId, userId, professionalId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        bookingId,
        userId: userId || '',
        professionalId: professionalId || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      type: error.type || 'unknown'
    });
  }
});

/**
 * Get Payment Status
 * GET /api/payment-status/:paymentIntentId
 */
app.get('/api/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stripe Webhook Handler
 * POST /webhook
 */
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Handle successful payment
 * Updates Firestore booking status
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { bookingId, userId, professionalId } = paymentIntent.metadata;

    if (!bookingId) {
      console.error('No bookingId in payment intent metadata');
      return;
    }

    // Note: In a real implementation, you would update Firestore here
    // For now, we'll log the success
    // You can add Firebase Admin SDK to update Firestore:
    // const admin = require('firebase-admin');
    // const db = admin.firestore();
    // const bookingRef = db.collection('artifacts').doc('your-app-id')
    //   .collection('public').doc('data').collection('bookings').doc(bookingId);
    // await bookingRef.update({
    //   paymentStatus: 'Paid',
    //   paymentIntentId: paymentIntent.id,
    //   paidAt: admin.firestore.FieldValue.serverTimestamp(),
    // });

    console.log(`Payment succeeded for booking ${bookingId}`);
    console.log(`User: ${userId}, Professional: ${professionalId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 * Updates Firestore booking status
 */
async function handlePaymentFailure(paymentIntent) {
  try {
    const { bookingId } = paymentIntent.metadata;

    if (!bookingId) {
      console.error('No bookingId in payment intent metadata');
      return;
    }

    // Note: In a real implementation, you would update Firestore here
    // Similar to handlePaymentSuccess above

    console.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Send Email
 * POST /api/send-email
 * Body: { to, subject, html, text? }
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    // Mock implementation - Replace with actual email service
    // For production, use SendGrid, Nodemailer, or similar
    console.log('📧 Email would be sent:', { to, subject });
    
    // TODO: Implement actual email sending
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: 'noreply@expertnextdoor.com', subject, html, text });

    res.json({ success: true, message: 'Email sent successfully (mock)' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

/**
 * Send SMS
 * POST /api/send-sms
 * Body: { to, message }
 */
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    // Mock implementation - Replace with actual SMS service
    // For production, use Twilio, AWS SNS, or similar
    console.log('📱 SMS would be sent:', { to, message });
    
    // TODO: Implement actual SMS sending
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });

    res.json({ success: true, message: 'SMS sent successfully (mock)' });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Payment API server running on port ${PORT}`);
  console.log(`Stripe configured: ${stripe ? 'Yes' : 'No'}`);
  console.log('📧 Email endpoint: POST /api/send-email');
  console.log('📱 SMS endpoint: POST /api/send-sms');
});
