import {
  openNodeBaseUrl,
  openNodeConfigured,
  siteOrigin,
} from "@/lib/plus/config";
import type { PlusChargeView } from "@/lib/plus/public";

export type PlusCharge = PlusChargeView;

type OpenNodeChargeData = {
  id: string;
  status: string;
  amount?: number;
  fiat_value?: number;
  source_fiat_value?: number;
  address?: string;
  uri?: string;
  hosted_checkout_url?: string;
  lightning_invoice?: { payreq?: string; expires_at?: number };
  chain_invoice?: { address?: string };
  order_id?: string;
  created_at?: number;
  ttl?: number;
};

const mockStore = new Map<string, PlusCharge>();

function mapOpenNode(
  data: OpenNodeChargeData,
  email: string,
  amountUsd: number,
): PlusCharge {
  const lnExpires = data.lightning_invoice?.expires_at;
  const created = data.created_at ?? Math.floor(Date.now() / 1000);
  const ttlMin = data.ttl ?? 1440;
  const expiresAt = lnExpires
    ? new Date(lnExpires * 1000).toISOString()
    : new Date((created + ttlMin * 60) * 1000).toISOString();

  return {
    id: data.id,
    status: data.status,
    amountUsd: data.fiat_value ?? data.source_fiat_value ?? amountUsd,
    amountSats: typeof data.amount === "number" ? data.amount : null,
    lightningInvoice: data.lightning_invoice?.payreq ?? null,
    onchainAddress: data.chain_invoice?.address ?? data.address ?? null,
    uri: data.uri ?? null,
    hostedCheckoutUrl: data.hosted_checkout_url ?? null,
    expiresAt,
    email,
    mock: false,
  };
}

export async function createPlusCharge(input: {
  email: string;
  amountUsd: number;
}): Promise<PlusCharge> {
  const email = input.email.trim().toLowerCase();
  const orderId = `plus:${email}:${Date.now()}`;

  if (!openNodeConfigured()) {
    const id = `mock_${crypto.randomUUID()}`;
    const charge: PlusCharge = {
      id,
      status: "unpaid",
      amountUsd: input.amountUsd,
      amountSats: Math.round((input.amountUsd / 95_000) * 100_000_000),
      lightningInvoice: `lntb_mock_invoice_for_${email}_pay_with_dev_endpoint`,
      onchainAddress: "bc1qmockopennodenotconfigured000000000000",
      uri: null,
      hostedCheckoutUrl: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      email,
      mock: true,
    };
    mockStore.set(id, charge);
    return charge;
  }

  const apiKey = process.env.OPENNODE_API_KEY!.trim();
  const origin = siteOrigin();
  const res = await fetch(`${openNodeBaseUrl()}/v1/charges`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountUsd,
      currency: "USD",
      description: "SneakerPulse Plus",
      customer_email: email,
      order_id: orderId,
      callback_url: `${origin}/api/plus/webhook`,
      success_url: `${origin}/plus?paid=1`,
      ttl: 60,
      notify_receiver: true,
    }),
  });

  const body = (await res.json()) as {
    data?: OpenNodeChargeData;
    message?: string;
  };
  if (!res.ok || !body.data?.id) {
    throw new Error(body.message || `OpenNode charge failed (${res.status})`);
  }
  return mapOpenNode(body.data, email, input.amountUsd);
}

export async function getPlusCharge(id: string): Promise<PlusCharge | null> {
  if (id.startsWith("mock_")) {
    return (
      mockStore.get(id) ?? {
        id,
        status: "unpaid",
        amountUsd: Number(process.env.PLUS_PRICE_USD ?? "10") || 10,
        amountSats: null,
        lightningInvoice: `lntb_mock_invoice_${id}`,
        onchainAddress: "bc1qmockopennodenotconfigured000000000000",
        uri: null,
        hostedCheckoutUrl: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        email: "",
        mock: true,
      }
    );
  }
  if (!openNodeConfigured()) return null;

  const apiKey = process.env.OPENNODE_API_KEY!.trim();
  const res = await fetch(`${openNodeBaseUrl()}/v1/charge/${id}`, {
    headers: { Authorization: apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: OpenNodeChargeData };
  if (!body.data?.id) return null;
  const email = emailFromOrderId(body.data.order_id);
  return mapOpenNode(body.data, email, body.data.fiat_value ?? 0);
}

function emailFromOrderId(orderId: string | undefined) {
  if (!orderId?.startsWith("plus:")) return "";
  const parts = orderId.split(":");
  return (parts[1] ?? "").toLowerCase();
}

export function markMockChargePaid(id: string) {
  const existing = mockStore.get(id);
  const base =
    existing ??
    ({
      id,
      status: "unpaid",
      amountUsd: Number(process.env.PLUS_PRICE_USD ?? "10") || 10,
      amountSats: null,
      lightningInvoice: `lntb_mock_invoice_${id}`,
      onchainAddress: "bc1qmockopennodenotconfigured000000000000",
      uri: null,
      hostedCheckoutUrl: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      email: "",
      mock: true,
    } satisfies PlusCharge);
  const next = { ...base, status: "paid" };
  mockStore.set(id, next);
  return next;
}

export function isPaidStatus(status: string) {
  return status === "paid" || status === "processing";
}
