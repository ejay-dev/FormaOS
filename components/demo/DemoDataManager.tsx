/**
 * Demo Data Manager
 * Auto-populates demo data when demo mode is activated
 */

'use client';

import { useEffect, useState } from 'react';
import { useDemo } from '@/lib/demo/demo-context';

export function DemoDataManager() {
  const { isDemoMode } = useDemo();
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (isDemoMode && !hasSeeded && !isSeeding) {
      seedDemoData();
    }
  }, [isDemoMode, hasSeeded, isSeeding]);

  async function seedDemoData() {
    setIsSeeding(true);

    try {
      console.log('[Demo Mode] Seeding demo data...');

      // Get demo organization ID from session or use default
      const demoOrgId = sessionStorage.getItem('formaos_demo_org_id');

      if (!demoOrgId) {
        console.warn('[Demo Mode] No demo org ID found, skipping seed');
        setHasSeeded(true);
        return;
      }

      // Call demo seed API
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: demoOrgId,
          eventsCount: 15,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to seed demo data');
      }

      const result = await response.json();
      console.log('[Demo Mode] Demo data seeded:', result);

      // Mark as seeded
      setHasSeeded(true);
      sessionStorage.setItem('formaos_demo_seeded', 'true');
    } catch (error) {
      console.error('[Demo Mode] Failed to seed demo data:', error);
      // Don't fail the demo if seeding fails
      setHasSeeded(true);
    } finally {
      setIsSeeding(false);
    }
  }

  // Cleanup on demo exit
  useEffect(() => {
    if (!isDemoMode) {
      setHasSeeded(false);
      sessionStorage.removeItem('formaos_demo_seeded');
    }
  }, [isDemoMode]);

  // This component doesn't render anything
  return null;
}
