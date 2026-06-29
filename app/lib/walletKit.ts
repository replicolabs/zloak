import { StellarWalletsKit, Networks, type ModuleInterface, type SwkAppTheme } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";

const zloakTheme: SwkAppTheme = {
  "background":            "#F2F2F3",
  "background-secondary":  "#EAEAEB",
  "foreground-strong":     "#0A0A0A",
  "foreground":            "#0A0A0A",
  "foreground-secondary":  "#6B6B6B",
  "primary":               "#0A0A0A",
  "primary-foreground":    "#F2F2F3",
  "transparent":           "rgba(0,0,0,0)",
  "lighter":               "rgba(255,255,255,0.75)",
  "light":                 "rgba(255,255,255,0.55)",
  "light-gray":            "rgba(0,0,0,0.05)",
  "gray":                  "#6B6B6B",
  "danger":                "oklch(57.7% 0.245 27.325)",
  "border":                "rgba(0,0,0,0.08)",
  "shadow":                "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)",
  "border-radius":         "1rem",
  "font-family":           '"Inter", system-ui, sans-serif',
};

let initDone = false;

export function initKit(): void {
  if (initDone || typeof window === "undefined") return;
  initDone = true;

  const modules: ModuleInterface[] = [new FreighterModule()];
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  const finish = () => {
    StellarWalletsKit.init({ modules, network: Networks.TESTNET });
    StellarWalletsKit.setTheme(zloakTheme);
  };

  if (projectId) {
    import("@creit.tech/stellar-wallets-kit/modules/wallet-connect").then(
      ({ WalletConnectModule, WalletConnectTargetChain }) => {
        modules.push(
          new WalletConnectModule({
            projectId,
            metadata: {
              name: "Zloak",
              description: "Private cross-border remittance on Stellar",
              url: window.location.origin,
              icons: [`${window.location.origin}/favicon.ico`],
            },
            allowedChains: [WalletConnectTargetChain.TESTNET],
          })
        );
        finish();
      }
    );
  } else {
    finish();
  }
}

export { StellarWalletsKit };
