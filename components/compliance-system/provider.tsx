"use client";

import React from "react";
import { ComplianceToastProvider } from "./compliance-toast";

/**
 * Client wrapper for the compliance system providers.
 * Use this in the app layout to enable toast notifications.
 */
export function ComplianceSystemProvider({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  return (
    <ComplianceToastProvider>
      {children}
    </ComplianceToastProvider>
  );
}

export default ComplianceSystemProvider;
