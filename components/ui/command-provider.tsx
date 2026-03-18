"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CommandContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // ✅ Global hotkey: ⌘K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && isK) {
        e.preventDefault();
        setOpen(true);
      }

      // ESC to close
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

export function useCommand() {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error("useCommand must be used within CommandProvider");
  return ctx;
}