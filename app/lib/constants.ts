import { Networks } from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC = process.env.NEXT_PUBLIC_SOROBAN_RPC ?? "https://soroban-testnet.stellar.org";
export const POOL_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_CONTRACT_ID ?? "";

export const USDC_SAC = process.env.NEXT_PUBLIC_USDC_SAC ?? "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
export const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER ?? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const USDC_CODE = "USDC";

export const DENOMINATION_USDC = 1;
export const DENOMINATION_STROOPS = BigInt(10_000_000);

export const SUPPORTED_CURRENCIES = ["USD", "GBP", "NGN"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const STELLAR_EXPERT_TESTNET = "https://stellar.expert/explorer/testnet";
