# Zloak — Private Cross-Border Remittance on Stellar

Send stablecoins across borders without leaving a traceable onchain link between sender and recipient. Zloak uses Groth16 zero-knowledge proofs verified natively on Soroban to break the deposit-withdrawal connection.

## The problem

Cross-border stablecoin transfers on public blockchains are fully traceable. Anyone can watch the chain and map every payment: who sent to whom, when, how much. For remittance, where the sender is often in one jurisdiction and the recipient in another, that exposure is a real problem: financial surveillance, targeting, and loss of privacy for people who already have limited alternatives.

Zloak makes those transfers private. A deposit transaction and a withdrawal transaction are cryptographically unlinkable onchain. The money moves, the connection does not.

## How it works

Zloak uses a Tornado Cash-style shielded pool adapted for Stellar/Soroban with BLS12-381 instead of BN254.

**Send flow:**

1. The user enters an amount in NGN, GBP, or USD, or types a plain-English instruction like "send ₦20000 to mama". The app converts to USDC at live exchange rates.
2. If the user's USDC balance is short, the app builds an XLM → USDC swap via Stellar's `PathPaymentStrictReceive` and prompts the user to sign it with Freighter.
3. For each 1-USDC denomination note:
   - **Commit**: The `stellar-coinutils` binary generates a fresh note (`value`, `label`, `nullifier`, `secret`) and computes a Poseidon commitment. The commitment is deposited into the Soroban privacy pool contract, which stores it as a leaf in a depth-20 LeanIMT (Lean Incremental Merkle Tree).
   - **Prove**: The app fetches the current pool state (all commitments) and builds a Circom SNARK witness input, Merkle sibling path, label inclusion path in the Association Set, and the private note fields. A Groth16 proof is generated server-side by the `/api/prove` route (snarkjs in Node.js). If the server call fails, the browser generates the proof locally via snarkjs WASM as a fallback.
   - **Withdraw**: The proof (serialised to Soroban binary encoding by `stellar-circom2soroban`) and its public signals are submitted to the Soroban contract's `withdraw` entrypoint. Soroban's native `bls12_381::groth16_verify` host function verifies the proof. On success, 1 USDC is transferred to the recipient with no onchain record connecting it to the deposit.

All signing is done client-side by the Freighter extension. The server holds no user private keys.

## The ZK, made concrete

**What the circuit proves (without revealing):**

- The prover knows a note (`value`, `label`, `nullifier`, `secret`) whose commitment is a leaf in the pool's current state tree,without revealing which leaf.
- The note's label is a member of the admin-managed Association Set, without revealing which label.
- The amount being withdrawn equals the note's value.

**What stays private:**

- Which commitment in the pool belongs to this withdrawal.
- The nullifier and secret (cannot be reconstructed from public signals).
- Which label is used (the compliance check passes without disclosure).

**Why removing the ZK collapses privacy:**

Without the proof, the contract would have to verify inclusion by scanning commitments directly, revealing the exact leaf and therefore the deposit transaction. The Merkle membership proof inside the circuit is what makes the check zero-knowledge. Remove it and you get a traceable pool, not a private one. The Association Set proof does the same for the compliance layer.

**Circuit summary:**

| Property | Value |
|---|---|
| File | `circuits/main.circom` — `Withdraw(20, 2)` |
| Curve | BLS12-381 |
| Hash | Poseidon255 (BLS12-381 scalar field parameterisation) |
| Non-linear constraints | 6,323 |
| Proof system | Groth16 |
| onchain verifier | `soroban_sdk::crypto::bls12_381` native host function |
| Trusted setup | Single-party ceremony (pot14). |
| Browser artifacts | `main.wasm` (1.5 MB), `main_final.zkey` (9.4 MB) |

**Public signals:** `[nullifierHash, withdrawnValue, stateRoot, associationRoot]`

The contract checks `stateRoot` against its live tree root and `associationRoot` against the stored admin root. Both must match. `nullifierHash` is stored onchain after use to prevent double-spend.

## Architecture

```
Browser (Next.js 16 / React 19)
│
├── WalletHome   — balance, send, receive, address book, history
├── SendModal    — manual entry or natural-language agent path
└── SendProgress — live phase display (preparing → proving → settling → done)

Server (Next.js API routes)
│
├── /api/agent              — Claude Haiku parses "send ₦20000 to mama"
│                             resolves contact name → Stellar address (MongoDB)
├── /api/coinutils/generate → execs stellar-coinutils generate
│                              manages Association Set (file or MongoDB)
│                              calls Soroban set_association_root (admin key)
├── /api/coinutils/withdraw-input
│                           → execs stellar-coinutils withdraw
│                              builds SNARK witness input with Merkle paths
├── /api/coinutils/encode   → execs stellar-circom2soroban
│                              serialises G1/G2 points to Soroban binary format
├── /api/prove              — server-side snarkjs (primary, 60–120 s)
├── /api/pool/deposit-tx    — builds Soroban deposit XDR (BASE_FEE × 10)
├── /api/pool/withdraw-tx   — builds Soroban withdraw XDR (BASE_FEE × 50)
├── /api/pool/submit        — submits any signed XDR to Horizon
├── /api/pool/state         — returns current Merkle root + all commitments
├── /api/pool/swap-tx       — builds XLM→USDC PathPaymentStrictReceive XDR
├── /api/balance            — USDC balance via Horizon
├── /api/fx                 — live USD rates (ExchangeRate-API, 1-hour cache)
├── /api/contacts           — CRUD address book (MongoDB)
└── /api/transfers          — CRUD transfer history (MongoDB)

Off-chain binaries (committed to app/bin/, compiled x86_64 Linux glibc 2.34)
├── stellar-coinutils       — Poseidon note generation, Merkle path computation
└── stellar-circom2soroban  — Groth16 proof/signal serialisation for Soroban

Soroban contract (Rust)
├── deposit(from, commitment)         — transfers 1 USDC, inserts leaf into LeanIMT
├── withdraw(to, proof, pub_signals)  — Groth16 verify, nullifier check, USDC transfer
├── set_association_root(admin, root) — compliance root update (admin only)
└── get_merkle_root / get_commitments — state queries

Stellar Testnet
├── Horizon API    — account queries, transaction submission
└── Soroban RPC    — contract simulation and invocation
```

## Components

| Path | What it is |
|---|---|
| `app/` | Next.js 16 application (frontend + API routes) |
| `app/lib/transfer.ts` | End-to-end send orchestration - the main flow |
| `app/lib/pool.ts` | Soroban XDR builders; `buildWithdrawTx` uses 120 s HTTP timeout |
| `app/lib/proof.ts` | Groth16 proof generation (server-first, browser fallback) |
| `app/lib/stellar.ts` | Horizon queries, XLM→USDC swap builder |
| `app/lib/fx.ts` | ExchangeRate-API wrapper with 1-hour in-memory cache |
| `app/models/` | Mongoose schemas: Transfer, Contact, AssociationSet |
| `app/bin/` | Compiled Rust CLI binaries (included in deployment) |
| `app/public/zk/` | WASM + zkey served statically (1.5 MB + 9.4 MB) |
| `soroban-privacy-pools/contracts/` | Soroban smart contract |
| `soroban-privacy-pools/libs/lean-imt/` | Incremental Merkle Tree (Poseidon, depth 20) |
| `soroban-privacy-pools/libs/zk/` | Groth16 verifier (BLS12-381 G1/G2) |
| `soroban-privacy-pools/circuits/` | Circom 2.2 circuits (main, commitment, merkleProof) |
| `soroban-privacy-pools/cli/coinutils/` | Note generation and Merkle path CLI |
| `soroban-privacy-pools/cli/circom2soroban/` | Proof encoder for Soroban binary format |

## Prerequisites

- Node.js 20+
- Rust + Cargo (`rustup`)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/stellar-cli)
- [Freighter browser extension](https://www.freighter.app/) set to **Stellar Testnet**
- MongoDB Atlas cluster (or local MongoDB 7+)
- Anthropic API key (Claude Haiku)
- ExchangeRate-API key (free tier)

## Setup and local run

```bash
# Clone the repo
git clone https://github.com/replicolabs/zloak.git
cd zloak

# Build the CLI binaries (required for API routes)
cd soroban-privacy-pools
cargo build --release -p coinutils -p circom2soroban
cp target/release/coinutils ../app/bin/stellar-coinutils
cp target/release/circom2soroban ../app/bin/stellar-circom2soroban
chmod +x ../app/bin/stellar-coinutils ../app/bin/stellar-circom2soroban

# Configure the app
cd ../app
cp .env .env.local
```

Edit `.env.local` and fill in the blanks:

```env
# Required - fill these in
MONGODB_URI=mongodb+srv://...
ANTHROPIC_API_KEY=sk-ant-...
EXCHANGE_RATE_API_KEY=...

# Association set storage (file = local dev, omit to use cloud database)
ASSOCIATION_FILE=/tmp/zloak_assoc.json

# Admin keypair for onchain Association Set updates
ADMIN_ADDRESS=<admin Stellar address>
ADMIN_SECRET_KEY=<admin secret key>

# Pre-filled testnet defaults (do not change for local dev):
NEXT_PUBLIC_POOL_CONTRACT_ID=CAQ6S4EMLJTT6UY4W5QGVYVHJJGFWL2Z55OT2VXCVMBKVY5QXWVYB6FO
NEXT_PUBLIC_USDC_SAC=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
```

```bash
npm install
npm run dev
# → http://localhost:3000
```

Connect Freighter to Stellar Testnet, fund the account with testnet XLM from the [friendbot](https://friendbot.stellar.org), then top it up with Circle testnet USDC from their [faucet](https://faucet.circle.com).

## Testnet details

| | |
|---|---|
| Network | Stellar Testnet |
| Horizon | `https://horizon-testnet.stellar.org` |
| Soroban RPC | `https://soroban-testnet.stellar.org` |
| Pool contract | `CAQ6S4EMLJTT6UY4W5QGVYVHJJGFWL2Z55OT2VXCVMBKVY5QXWVYB6FO` |
| USDC SAC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| USDC issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` (Circle testnet) |
| Fixed denomination | 1 USDC per note (10,000,000 stroops) |

## Acknowledgement

The Soroban contract skeleton, Circom circuits, Poseidon255 implementation, LeanIMT, coinutils CLI, and circom2soroban serializer originate from [ymcrcat/soroban-privacy-pools](https://github.com/ymcrcat/soroban-privacy-pools) (MIT). Zloak modified the fixed denomination to match Stellar's 7-decimal USDC and built the full product on top: the Next.js application, the natural-language agent, the multi-currency conversion, the MongoDB persistence, the XLM→USDC swap, the Association Set management flow, and the end-to-end browser-to-contract integration verified on Stellar testnet.

## License

MIT
