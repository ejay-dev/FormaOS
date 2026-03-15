'use client';

import { AiAssistantProvider } from './AiAssistantContext';
import { AiAssistantPanel } from './AiAssistantPanel';

export function AiAssistant() {
  return (
    <AiAssistantProvider>
      <AiAssistantPanel />
    </AiAssistantProvider>
  );
}
