"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLinks } from "./NavLinks";

const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au')
  .replace(/\/$/, '');


/**
 * =========================================================
 * MOBILE NAV COMPONENT - FIXED
 * =========================================================
 * Premium mobile menu with:
 * - Smooth open/close animations
 * - Click-outside to close
 * - Escape key to close
 * - Body scroll lock when open
 * - No overlap with hero content
 * - Glassmorphism design
 */

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const trapFocus = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !menuRef.current) return;

    const focusable = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

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
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus first link when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLElement>('a, button');
      if (firstLink) {
        requestAnimationFrame(() => firstLink.focus());
      }
    }
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
        className="mk-btn mk-btn-secondary flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-white font-medium active:scale-95"
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
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Full-screen overlay with proper z-index */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            onClick={handleBackdropClick}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Backdrop with blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />

            {/* Menu panel - positioned below header */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mk-mobile-sheet absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+4.5rem)] max-h-[calc(100vh-6rem)] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapFocus}
            >
              {/* Decorative top line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <span className="text-sm font-bold text-white tracking-wide">Menu</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="p-4">
                  <NavLinks variant="mobile" onLinkClick={handleLinkClick} />
                </div>

                {/* Divider with gradient */}
                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Auth buttons */}
                <div className="p-4 space-y-3">
                  <Link
                    href={`${appBase}/auth/signin`}
                    onClick={handleLinkClick}
                    className="mk-btn mk-btn-secondary flex items-center justify-between w-full rounded-xl px-4 py-3.5 text-sm"
                  >
                    <span>Login</span>
                    <ChevronRight className="h-4 w-4 text-white/50" />
                  </Link>
                  <Link
                    href={`${appBase}/auth/signup?plan=pro&source=mobile_nav`}
                    onClick={handleLinkClick}
                    className="mk-btn mk-btn-primary flex items-center justify-center w-full rounded-xl px-4 py-3.5 text-sm font-bold"
                  >
                    Start Free Trial
                  </Link>
                </div>

                {/* Footer trust indicators */}
                <div className="px-4 pb-5 pt-2">
                  <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                      14-day trial
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                      No credit card
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom decorative line */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
