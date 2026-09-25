"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ChromeContextValue = {
  slimNav: boolean;
  setSlimNav: (slim: boolean) => void;
};

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [slimNav, setSlimNav] = useState(false);
  return (
    <ChromeContext.Provider value={{ slimNav, setSlimNav }}>
      {children}
    </ChromeContext.Provider>
  );
}

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within ChromeProvider");
  return ctx;
}

/** Call from a page to collapse the top nav to a slim bar while mounted (e.g. a live auction room). */
export function useSlimNav(enabled: boolean) {
  const { setSlimNav } = useChrome();
  useEffect(() => {
    if (enabled) setSlimNav(true);
    return () => setSlimNav(false);
  }, [enabled, setSlimNav]);
}
