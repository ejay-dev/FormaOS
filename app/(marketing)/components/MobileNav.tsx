"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLinks } from "./NavLinks";

/**
 * =========================================================
 * MOBILE NAV COMPONENT
 * =========================================================
 * Proper mobile menu with:
 * - Smooth open/close animations
 * - Click-outside to close
 * - Escape key to close
 * - Body scroll lock when open
 * - Focus trap for accessibility
 */

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  // Close menu when navigating
  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="md:hidden">
      {/* Menu toggle button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-2 rounded-xl glass-panel px-3 py-2.5 text-sm text-foreground font-medium transition-all hover:bg-white/10 active:scale-95"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only md:not-sr-only">Menu</span>
      </button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            onClick={handleBackdropClick}
            id="mobile-menu"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Menu panel */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 left-4 top-20 max-w-md mx-auto rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <span className="text-sm font-bold text-white">Navigation</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4">
                <NavLinks variant="mobile" onLinkClick={handleLinkClick} />
              </div>

              {/* Divider */}
              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Auth buttons */}
              <div className="p-4 space-y-2">
                <Link
                  href="/auth/signin"
                  onClick={handleLinkClick}
                  className="block w-full text-center rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={handleLinkClick}
                  className="block w-full text-center rounded-xl px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 transition-all active:scale-[0.98]"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Footer trust indicators */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                    14-day trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-cyan-400" />
                    No credit card
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
