import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const APP_URL = "https://synk-kappa.vercel.app";

// Must match GEM_PACKS in GemShopModal.tsx (price in euro cents)
const PACKS: Record<number, { bonus: number; amountCents: number; label: string }> = {
  500:   { bonus: 50,   amountCents: 359,   label: "500 Gemmes + 50 bonus"   },
  1000:  { bonus: 100,  amountCents: 699,   label: "1 000 Gemmes + 100 bonus" },
  2500:  { bonus: 250,  amountCents: 1699,  label: "2 500 Gemmes + 250 bonus" },
  5000:  { bonus: 500,  amountCents: 3299,  label: "5 000 Gemmes + 500 bonus" },
  10000: { bonus: 1000, amountCents: 6399,  label: "10 000 Gemmes + 1 000 bonus" },
  25000: { bonus: 2500, amountCents: 15599, label: "25 000 Gemmes + 2 500 bonus" },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { gems } = req.body ?? {};
  const pack = PACKS[gems as number];

  if (!pack) {
    return res.status(400).json({ error: "Pack invalide" });
  }

  const totalGems = gems + pack.bonus;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: pack.label,
              description: `Total : ${totalGems.toLocaleString("fr-FR")} gemmes pour RandomChat`,
              images: [`${APP_URL}/icon-512.png`],
            },
            unit_amount: pack.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${APP_URL}/?payment=success&gems=${totalGems}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?payment=cancelled`,
      locale: "fr",
    });

    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Stripe] create-checkout-session error:", message);
    return res.status(500).json({ error: message });
  }
}
