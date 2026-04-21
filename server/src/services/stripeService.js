const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession({ size, handlingFeeCents, successUrl, cancelUrl }) {
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
  return stripe.checkout.sessions.retrieve(sessionId);
}

module.exports = { createCheckoutSession, retrieveSession };
