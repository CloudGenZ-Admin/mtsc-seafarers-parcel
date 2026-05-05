const Stripe = require('stripe');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

async function createCheckoutSession({ size, handlingFeeCents, successUrl, cancelUrl }) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: { name: `Parcel Handling Fee - ${size}` },
        unit_amount: handlingFeeCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

async function retrieveSession(sessionId) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

module.exports = { createCheckoutSession, retrieveSession };
