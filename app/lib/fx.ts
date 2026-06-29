import { SupportedCurrency } from "./constants";

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

interface RateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error(`ExchangeRate-API error: ${res.status}`);
  const data = await res.json();
  if (data.result !== "success") throw new Error(`ExchangeRate-API: ${data["error-type"]}`);

  cache = { rates: data.conversion_rates, fetchedAt: Date.now() };
  return cache.rates;
}

export async function toUsdc(amount: number, currency: SupportedCurrency): Promise<number> {
  if (currency === "USD") return Math.round(amount * 100) / 100;

  const rates = await fetchRates();
  const rateVsUsd = rates[currency];
  if (!rateVsUsd) throw new Error(`Unsupported currency: ${currency}`);

  const usd = amount / rateVsUsd;
  return Math.round(usd * 100) / 100;
}

export async function getDisplayRates(): Promise<{ NGN: number; GBP: number }> {
  const rates = await fetchRates();
  return { NGN: rates.NGN, GBP: rates.GBP };
}
