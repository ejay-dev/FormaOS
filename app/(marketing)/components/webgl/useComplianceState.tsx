'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type ComplianceState = 'model' | 'execute' | 'verify' | 'prove';

interface ComplianceContextType {
  state: ComplianceState;
  setState: (state: ComplianceState) => void;
}

const ComplianceContext = createContext<ComplianceContextType | null>(null);

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComplianceState>('model');
  
  return (
    <ComplianceContext.Provider value={{ state, setState }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};