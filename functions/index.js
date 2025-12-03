/**
 * Firebase Cloud Functions v2 for Stripe Payment Processing
 *
 * Setup:
 * 1. npm install in functions/ directory
 * 2. Set Stripe secret key: firebase functions:secrets:set STRIPE_SECRET_KEY
 * 3. Deploy: firebase deploy --only functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {defineSecret} = require("firebase-functions/params");

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Initialize Stripe
let Stripe;
let stripe;

/**
 * Lazy load Stripe to avoid errors if secret is not set
 * @return {Object} Stripe instance
 */
function getStripe() {
  if (!Stripe) {
    Stripe = require("stripe");
  }
  if (!stripe) {
    const secretKey = stripeSecretKey.value() || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Stripe secret key not configured");
    }
    stripe = new Stripe(secretKey);
  }
  return stripe;
}

// Set global options
setGlobalOptions({maxInstances: 10});

/**
 * Create a Payment Intent
 * Called from frontend when user wants to pay
 */
exports.createPaymentIntent = onCall(
    {
      secrets: [stripeSecretKey],
      cors: true,
    },
    async (request) => {
      // Verify user is authenticated
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "User must be authenticated to create payment intent",
        );
      }

      const {amount, currency = "usd", bookingId} = request.data;

      // Validate input
      if (!amount || amount <= 0) {
        throw new HttpsError(
            "invalid-argument",
            "Amount must be greater than 0",
        );
      }

      if (!bookingId) {
        throw new HttpsError(
            "invalid-argument",
            "Booking ID is required",
        );
      }

      try {
        // Verify booking exists and belongs to user
        const db = admin.firestore();
        const appId = process.env.APP_ID || "default";
        const bookingRef = db
            .collection("artifacts")
            .doc(appId)
            .collection("public")
            .doc("data")
            .collection("bookings")
            .doc(bookingId);

        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
          throw new HttpsError(
              "not-found",
              "Booking not found",
          );
        }

        const bookingData = bookingDoc.data();

        // Verify booking belongs to authenticated user
        if (bookingData.userId !== request.auth.uid) {
          throw new HttpsError(
              "permission-denied",
              "Booking does not belong to user",
          );
        }

        // Verify booking is awaiting payment
        if (bookingData.paymentStatus !== "Awaiting Payment") {
          throw new HttpsError(
              "failed-precondition",
              "Booking is not awaiting payment",
          );
        }

        // Create Payment Intent with Stripe
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency,
          metadata: {
            bookingId: bookingId,
            userId: request.auth.uid,
            professionalId: bookingData.professionalId || "",
          },
          // Optional: Add automatic payment methods
          automatic_payment_methods: {
            enabled: true,
          },
        });

        // Store Payment Intent ID in booking (optional, for tracking)
        await bookingRef.update({
          paymentIntentId: paymentIntent.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error) {
        logger.error("Error creating payment intent:", error);

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "Failed to create payment intent",
            error.message,
        );
      }
    },
);

/**
 * Webhook handler for Stripe events
 * Handles payment confirmations and updates Firestore
 */
exports.stripeWebhook = onRequest(
    {
      secrets: [stripeWebhookSecret],
      cors: true,
    },
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = stripeWebhookSecret.value() ||
        process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error("Stripe webhook secret not configured");
        return res.status(500).send("Webhook secret not configured");
      }

      let event;

      try {
        // Verify webhook signature
        const stripeInstance = getStripe();
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret,
        );
      } catch (err) {
        logger.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const db = admin.firestore();

      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentSuccess(db, event.data.object);
          break;

        case "payment_intent.payment_failed":
          await handlePaymentFailure(db, event.data.object);
          break;

        default:
          logger.log(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      res.json({received: true});
    },
);

/**
 * Handle successful payment
 * @param {Object} db Firestore database instance
 * @param {Object} paymentIntent Stripe payment intent object
 */
async function handlePaymentSuccess(db, paymentIntent) {
  try {
    const {bookingId, professionalId} = paymentIntent.metadata;

    if (!bookingId) {
      logger.error("No bookingId in payment intent metadata");
      return;
    }

    const appId = process.env.APP_ID || "default";
    const bookingRef = db
        .collection("artifacts")
        .doc(appId)
        .collection("public")
        .doc("data")
        .collection("bookings")
        .doc(bookingId);

    // Update booking payment status
    await bookingRef.update({
      paymentStatus: "Paid",
      paymentIntentId: paymentIntent.id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to professional
    if (professionalId) {
      try {
        const notificationsRef = db
            .collection("artifacts")
            .doc(appId)
            .collection("users")
            .doc(professionalId)
            .collection("notifications");

        await notificationsRef.add({
          userId: professionalId,
          message: `Payment received for booking ${bookingId}`,
          type: "payment_received",
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (notifError) {
        logger.error("Error sending payment notification:", notifError);
      }
    }

    logger.log(`Payment succeeded for booking ${bookingId}`);
  } catch (error) {
    logger.error("Error handling payment success:", error);
  }
}

/**
 * Handle failed payment
 * @param {Object} db Firestore database instance
 * @param {Object} paymentIntent Stripe payment intent object
 */
async function handlePaymentFailure(db, paymentIntent) {
  try {
    const {bookingId} = paymentIntent.metadata;

    if (!bookingId) {
      logger.error("No bookingId in payment intent metadata");
      return;
    }

    const appId = process.env.APP_ID || "default";
    const bookingRef = db
        .collection("artifacts")
        .doc(appId)
        .collection("public")
        .doc("data")
        .collection("bookings")
        .doc(bookingId);

    // Update booking with failure info
    await bookingRef.update({
      paymentStatus: "Payment Failed",
      paymentIntentId: paymentIntent.id,
      paymentError: (paymentIntent.last_payment_error &&
        paymentIntent.last_payment_error.message) ||
        "Payment failed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    logger.error("Error handling payment failure:", error);
  }
}

/**
 * Get payment status
 * Allows frontend to check payment status
 */
exports.getPaymentStatus = onCall(
    {
      secrets: [stripeSecretKey],
      cors: true,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "User must be authenticated",
        );
      }

      const {paymentIntentId} = request.data;

      if (!paymentIntentId) {
        throw new HttpsError(
            "invalid-argument",
            "Payment Intent ID is required",
        );
      }

      try {
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(
            paymentIntentId,
        );

        return {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
        };
      } catch (error) {
        logger.error("Error retrieving payment intent:", error);
        throw new HttpsError(
            "internal",
            "Failed to retrieve payment status",
            error.message,
        );
      }
    },
);
