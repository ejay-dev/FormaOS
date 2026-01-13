/**
 * =========================================================
 * FORMAOS SYSTEM STATE - EXPORTS
 * =========================================================
 * 
 * This module provides the central system state engine that
 * controls all node/wire behavior and feature gating.
 * 
 * Architecture:
 * - types.ts: Type definitions and static configuration
 * - context.tsx: Client-side React context and hooks
 * - server.ts: Server-side data fetching (DO NOT import in client)
 * - actions.ts: Server actions for mutations
 */

// Types and static configuration
export * from "./types";

// Client-side context and hooks
export { SystemStateProvider, useSystemState } from "./context";

// Note: server.ts and actions.ts are NOT exported here to prevent
// accidental client-side imports. Import them directly when needed:
// import { fetchSystemState } from "@/lib/system-state/server";
// import { getSystemState } from "@/lib/system-state/actions";
