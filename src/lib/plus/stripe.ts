/**
 * Stripe Checkout for SPI Plus (card payments).
 * Server-only — pair with /api/plus/webhook/stripe + /api/plus/stripe/complete.
 */
import "server-only";

import Stripe from "stripe";
import { siteUrl } from "@/lib/brand";
import type { PlusOffer } from "@/lib/plus/purchases";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
  });
}

export type StripeCheckoutResult = {
  id: string;
  url: string;
  email: string;
  amountUsd: number;
  plan: PlusOffer["plan"];
  termDays: number;
  mock: boolean;
};

export async function createStripeCheckoutSession(input: {
  email: string;
  offer: PlusOffer;
}): Promise<StripeCheckoutResult> {
  const email = input.email.trim().toLowerCase();
  const stripe = getStripe();
  const origin = siteUrl();

  if (!stripe) {
    const id = `mock_stripe_${crypto.randomUUID()}`;
    return {
      id,
      url: `${origin}/plus?stripe_session=${encodeURIComponent(id)}&mock=1`,
      email,
      amountUsd: input.offer.amountUsd,
      plan: input.offer.plan,
      termDays: input.offer.termDays,
      mock: true,
    };
  }

  const foundingPrice = process.env.STRIPE_PRICE_FOUNDING_YEARLY?.trim();
  const standardPrice = process.env.STRIPE_PRICE_PLUS?.trim();
  const priceId =
    input.offer.plan === "founding" ? foundingPrice : standardPrice;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(input.offer.amountUsd * 100),
            product_data: {
              name:
                input.offer.plan === "founding"
                  ? "SPI Plus · Founding year"
                  : "SPI Plus",
              description: input.offer.label,
            },
          },
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: email,
    line_items: lineItems,
    success_url: `${origin}/plus?stripe_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plus?canceled=1`,
    metadata: {
      email,
      plan: input.offer.plan,
      termDays: String(input.offer.termDays),
      amountUsd: String(input.offer.amountUsd),
      product: "spi_plus",
    },
  });

  if (!session.id || !session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    id: session.id,
    url: session.url,
    email,
    amountUsd: input.offer.amountUsd,
    plan: input.offer.plan,
    termDays: input.offer.termDays,
    mock: false,
  };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) {
    if (sessionId.startsWith("mock_stripe_")) {
      return {
        id: sessionId,
        payment_status: "paid" as const,
        status: "complete" as const,
        customer_email: null as string | null,
        client_reference_id: null as string | null,
        metadata: {} as Record<string, string>,
        amount_total: null as number | null,
        mock: true,
      };
    }
    return null;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    customer_email: session.customer_email,
    client_reference_id: session.client_reference_id,
    metadata: (session.metadata ?? {}) as Record<string, string>,
    amount_total: session.amount_total,
    mock: false,
  };
}

export function constructStripeEvent(
  payload: string | Buffer,
  signature: string,
) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    throw new Error("Stripe webhook is not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
