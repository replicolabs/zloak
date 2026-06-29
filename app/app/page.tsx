"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "@/components/Landing";
import ConnectGate from "@/components/ConnectGate";
import Splash from "@/components/Splash";
import WalletHome from "@/components/WalletHome";
import Blobs from "@/components/ui/Blobs";
import { Currency } from "@/components/ui/CurrencySelector";

type AppScreen = "landing" | "gate" | "splash" | "wallet";

const SLIDE: Record<AppScreen, number> = { landing: 0, gate: 1, splash: 2, wallet: 3 };

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [address, setAddress] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("NGN");

  const handleLaunch = useCallback(() => setScreen("gate"), []);

  const handleConnected = useCallback((addr: string) => {
    setAddress(addr);
    setScreen("splash");
  }, []);

  const handleSplashDone = useCallback(() => setScreen("wallet"), []);

  const handleDisconnect = useCallback(() => {
    setAddress("");
    setScreen("gate");
  }, []);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  const prevScreen = screen === "gate" ? "landing" : screen === "splash" ? "gate" : screen === "wallet" ? "splash" : "landing";
  const dir = SLIDE[screen] - SLIDE[prevScreen];

  return (
    <div className="fixed inset-0" style={{ background: "var(--surface)", overflow: "hidden" }}>
      <Blobs />
      <AnimatePresence mode="wait" custom={dir}>
        {screen === "landing" && (
          <motion.div
            key="landing"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0"
          >
            <Landing onLaunch={handleLaunch} />
          </motion.div>
        )}

        {screen === "gate" && (
          <motion.div
            key="gate"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0"
          >
            <ConnectGate onConnected={handleConnected} />
          </motion.div>
        )}

        {screen === "splash" && (
          <motion.div
            key="splash"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0"
          >
            <Splash onDone={handleSplashDone} />
          </motion.div>
        )}

        {screen === "wallet" && (
          <motion.div
            key="wallet"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 overflow-y-auto"
          >
            <WalletHome
              address={address}
              currency={currency}
              onCurrencyChange={setCurrency}
              onDisconnect={handleDisconnect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
