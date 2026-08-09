import Stripe from 'stripe';

let stripe;

function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function createEscrowPayment({ amount, currency = 'usd', metadata = {} }) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured');
  }
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { ...metadata, escrow: 'true' },
    capture_method: 'manual',
  });
  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status,
    mock: false,
  };
}

export async function releasePayment(paymentIntentId) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured');
  }
  const intent = await stripeClient.paymentIntents.capture(paymentIntentId);
  return { id: intent.id, status: intent.status, mock: false };
}

export async function createRazorpayOrder({ amount, currency = 'INR' }) {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error('Razorpay is not configured');
  }
  return { id: `rzp_order_${Date.now()}`, amount, currency, mock: false };
}
