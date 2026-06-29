import {
  Horizon,
  rpc as SorobanRpc,
  Asset,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, SOROBAN_RPC, NETWORK_PASSPHRASE, USDC_CODE, USDC_ISSUER } from "./constants";

export const horizon = new Horizon.Server(HORIZON_URL);
export const soroban = new SorobanRpc.Server(SOROBAN_RPC);

export const usdcAsset = new Asset(USDC_CODE, USDC_ISSUER);

export async function getUsdcBalance(publicKey: string): Promise<number> {
  const account = await horizon.loadAccount(publicKey);
  const line = account.balances.find(
    (b) => b.asset_type !== "native" && (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_code === USDC_CODE && (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_issuer === USDC_ISSUER
  );
  if (!line) return 0;
  return parseFloat(line.balance);
}

export async function getXlmBalance(publicKey: string): Promise<number> {
  const account = await horizon.loadAccount(publicKey);
  const native = account.balances.find((b) => b.asset_type === "native");
  return native ? parseFloat(native.balance) : 0;
}

export async function buildSwapXlmForUsdc(
  publicKey: string,
  usdcNeeded: number
): Promise<string | null> {
  const balance = await getUsdcBalance(publicKey);
  if (balance >= usdcNeeded) return null; // already have enough

  const account = await horizon.loadAccount(publicKey);
  const hasTrustline = account.balances.some(
    (b) =>
      b.asset_type !== "native" &&
      (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_code === USDC_CODE &&
      (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_issuer === USDC_ISSUER
  );

  const deficit = usdcNeeded - balance;
  const xlmBalance = await getXlmBalance(publicKey);
  const sendMaxXlm = Math.min(xlmBalance * 0.8, deficit * 15).toFixed(7); 

  const builder = new TransactionBuilder(account, {
    fee: String(Number(BASE_FEE) * 3),
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (!hasTrustline) {
    builder.addOperation(
      Operation.changeTrust({ asset: usdcAsset })
    );
  }

  builder.addOperation(
    Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: sendMaxXlm,
      destination: publicKey,
      destAsset: usdcAsset,
      destAmount: deficit.toFixed(7),
      path: [],
    })
  );

  const tx = builder.setTimeout(30).build();
  return tx.toXDR();
}

export async function submitTransaction(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const result = await horizon.submitTransaction(tx as Parameters<typeof horizon.submitTransaction>[0]);
  return result.hash;
}
