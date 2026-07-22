"use client";

import { useSyncExternalStore } from "react";
import type { PriceAlert } from "@/types/market";

const STORAGE_KEY = "sneakerpulse.alerts";

let memoryAlerts: PriceAlert[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): PriceAlert[] {
  if (memoryAlerts == null) {
    memoryAlerts = loadAlerts();
  }
  return memoryAlerts;
}

function getServerSnapshot(): PriceAlert[] {
  return [];
}

function persist(next: PriceAlert[]) {
  memoryAlerts = next;
  saveAlerts(next);
  emit();
}

export function usePriceAlerts() {
  const alerts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function addAlert(alert: Omit<PriceAlert, "id" | "createdAt"> & Partial<Pick<PriceAlert, "id" | "createdAt">>) {
    const next: PriceAlert = {
      id: alert.id ?? crypto.randomUUID(),
      createdAt: alert.createdAt ?? new Date().toISOString(),
      slug: alert.slug,
      ticker: alert.ticker,
      name: alert.name,
      direction: alert.direction,
      threshold: alert.threshold,
      webhookUrl: alert.webhookUrl,
    };
    persist([next, ...alerts]);
    return next;
  }

  function removeAlert(id: string) {
    persist(alerts.filter((alert) => alert.id !== id));
  }

  return { alerts, addAlert, removeAlert };
}
