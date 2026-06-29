import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  Account,
  xdr,
  Networks,
  BASE_FEE,
  nativeToScVal,
  Address,
  scValToNative,
} from "@stellar/stellar-sdk";
import { soroban, horizon } from "./stellar";
import { POOL_CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_RPC } from "./constants";

const DUMMY_READ_ACCOUNT = new Account(
  "GAFOJWXDXPA5YJ5K7MFB4KNNC2XL7ENVIM6ELWF5RTCXWHXJG5WZT6QY",
  "0"
);

export async function buildDepositTx(
  callerPublicKey: string,
  commitmentHex: string
): Promise<string> {
  const account = await horizon.loadAccount(callerPublicKey);
  const contract = new Contract(POOL_CONTRACT_ID);

  const commitmentBytes = Buffer.from(commitmentHex.replace("0x", ""), "hex");

  const tx = new TransactionBuilder(account, {
    fee: String(Number(BASE_FEE) * 10),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "deposit",
        new Address(callerPublicKey).toScVal(),
        xdr.ScVal.scvBytes(commitmentBytes)
      )
    )
    .setTimeout(300)
    .build();

  const sim = await soroban.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Deposit simulation failed: ${sim.error}`);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  return prepared.toXDR();
}

export async function buildWithdrawTx(
  callerPublicKey: string,
  recipientPublicKey: string,
  proofHex: string,
  pubSignalsHex: string
): Promise<string> {
  const account = await horizon.loadAccount(callerPublicKey);
  const contract = new Contract(POOL_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: String(Number(BASE_FEE) * 50),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "withdraw",
        new Address(recipientPublicKey).toScVal(),
        xdr.ScVal.scvBytes(Buffer.from(proofHex, "hex")),
        xdr.ScVal.scvBytes(Buffer.from(pubSignalsHex, "hex"))
      )
    )
    .setTimeout(300)
    .build();

  const slowSoroban = new SorobanRpc.Server(SOROBAN_RPC);
  (slowSoroban as unknown as { httpClient: { defaults: { timeout: number } } })
    .httpClient.defaults.timeout = 120000;

  const sim = await slowSoroban.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Withdraw simulation failed: ${sim.error}`);
  }

  if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
    const retval = scValToNative(sim.result.retval);
    if (Array.isArray(retval) && retval.length > 0 && retval[0]) {
      throw new Error(`Contract rejected withdrawal: ${retval[0]}`);
    }
  }

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  return prepared.toXDR();
}

export async function getPoolState(): Promise<{
  root: string;
  commitments: string[];
}> {
  const contract = new Contract(POOL_CONTRACT_ID);
  const account = new Account(DUMMY_READ_ACCOUNT.accountId(), DUMMY_READ_ACCOUNT.sequenceNumber());

  const rootTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_merkle_root"))
    .setTimeout(30)
    .build();

  const commitsTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_commitments"))
    .setTimeout(30)
    .build();

  const [rootSim, commitsSim] = await Promise.all([
    soroban.simulateTransaction(rootTx),
    soroban.simulateTransaction(commitsTx),
  ]);

  const rootHex = SorobanRpc.Api.isSimulationSuccess(rootSim)
    ? Buffer.from((rootSim.result?.retval as xdr.ScVal).bytes()).toString("hex")
    : "0".repeat(64);

  const commitments: string[] = [];
  if (SorobanRpc.Api.isSimulationSuccess(commitsSim)) {
    const vec = (commitsSim.result?.retval as xdr.ScVal).vec();
    if (vec) {
      for (const item of vec) {
        commitments.push(Buffer.from(item.bytes()).toString("hex"));
      }
    }
  }

  return { root: rootHex, commitments };
}

export async function getAssociationRoot(): Promise<string> {
  const contract = new Contract(POOL_CONTRACT_ID);
  const account = new Account(DUMMY_READ_ACCOUNT.accountId(), DUMMY_READ_ACCOUNT.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_association_root"))
    .setTimeout(30)
    .build();

  const sim = await soroban.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) return "0".repeat(64);
  return Buffer.from((sim.result?.retval as xdr.ScVal).bytes()).toString("hex");
}
