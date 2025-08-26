// Netlify serverless function: create-checkout.js
// Χρησιμοποιεί το Stripe Secret Key από τα Environment Variables

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Data from frontend
    const { title, price } = JSON.parse(event.body);
    console.log("Received data from frontend:", { title, price });

    // Validate τιμή
    if (!price || isNaN(price)) {
      throw new Error(`Invalid price value received: ${price}`);
    }

    // Δημιουργία Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // επιτρέπουμε κάρτες
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: title || "Beat",
            },
            unit_amount: Math.round(price * 100), // τιμή σε cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.URL}/thankyou.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
    });

    console.log("Checkout Session created:", session.id);

    // Επιστρέφουμε το session στον client
    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    console.error("Stripe Checkout Error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error while creating checkout",
      }),
    };
  }
};
