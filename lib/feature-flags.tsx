// lib/feature-flags.ts
import React from 'react'

interface FeatureFlags {
  // QA & Testing Features
  enableAdvancedMonitoring: boolean
  enablePerformanceTracking: boolean
  enableVisualRegression: boolean

  // UX Improvements
  enableButtonFeedback: boolean
  enableScrollAnimations: boolean
  enableSectionRhythm: boolean

  // Admin Features
  enableFounderIsolation: boolean
  enableAuditLogging: boolean

  // Email Features
  enableBrandedEmails: boolean
  enableResendIntegration: boolean

  // Performance Features
  enableRoutePrefetch: boolean
  enableLazyLoading: boolean
  enableBundleOptimization: boolean

  // Intelligence Features
  enableIntelligence: boolean
}

const DEFAULT_FLAGS: FeatureFlags = {
  // All flags default to OFF for safety
  enableAdvancedMonitoring: false,
  enablePerformanceTracking: false,
  enableVisualRegression: false,
  enableButtonFeedback: false,
  enableScrollAnimations: false,
  enableSectionRhythm: false,
  enableFounderIsolation: false,
  enableAuditLogging: false,
  enableBrandedEmails: false,
  enableResendIntegration: false,
  enableRoutePrefetch: false,
  enableLazyLoading: false,
  enableBundleOptimization: false,
  // Intelligence defaults to ON in production, OFF elsewhere
  enableIntelligence: process.env.NODE_ENV === 'production' || process.env.INTELLIGENCE_ENABLED === 'true',
}

export class FeatureFlagManager {
  private flags: FeatureFlags
  private initialized: boolean = false

  constructor() {
    this.flags = this.loadFlags()
    this.initialized = true
  }

  private loadFlags(): FeatureFlags {
    try {
      // Load from environment variable
      const envFlags = process.env.NEXT_PUBLIC_FEATURE_FLAGS
      
      if (envFlags) {
        const parsedFlags = JSON.parse(envFlags)
        return { ...DEFAULT_FLAGS, ...parsedFlags }
      }
      
      // Load from localStorage in browser
      if (typeof window !== 'undefined') {
        const storedFlags = localStorage.getItem('formaos_feature_flags')
        if (storedFlags) {
          const parsedFlags = JSON.parse(storedFlags)
          return { ...DEFAULT_FLAGS, ...parsedFlags }
        }
      }
    } catch (error) {
      console.warn('Failed to parse feature flags, using defaults:', error)
    }
    
    return DEFAULT_FLAGS
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    if (!this.initialized) {
      return false // Safe default
    }
    return this.flags[flag] || false
  }

  public getAll(): FeatureFlags {
    return { ...this.flags }
  }

  public updateFlag(flag: keyof FeatureFlags, enabled: boolean): void {
    this.flags[flag] = enabled
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('formaos_feature_flags', JSON.stringify(this.flags))
    }
  }

  public enableFlag(flag: keyof FeatureFlags): void {
    this.updateFlag(flag, true)
  }

  public disableFlag(flag: keyof FeatureFlags): void {
    this.updateFlag(flag, false)
  }

  // Emergency disable all flags
  public emergencyDisableAll(): void {
    Object.keys(this.flags).forEach(flag => {
      this.flags[flag as keyof FeatureFlags] = false
    })
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('formaos_feature_flags', JSON.stringify(this.flags))
    }
  }

  // For admin users - override flags for testing
  public setTestingMode(overrides: Partial<FeatureFlags>): void {
    if (typeof window !== 'undefined') {
      const isFounder = this.checkFounderAccess()
      if (isFounder) {
        this.flags = { ...this.flags, ...overrides }
        localStorage.setItem('formaos_feature_flags_testing', JSON.stringify(overrides))
      }
    }
  }

  private checkFounderAccess(): boolean {
    // TODO: Implement actual founder check
    // For now, return false for safety
    return false
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager()

// React hook for components
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const { useEffect, useState } = React
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  
  useEffect(() => {
    setIsEnabled(featureFlags.isEnabled(flag))
  }, [flag])
  
  return isEnabled
}

// Higher-order component for conditional rendering
export function withFeatureFlag<P extends object>(
  flag: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flag)
    
    if (isEnabled) {
      return <Component {...props} />
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />
    }
    
    return null
  }
}

// Utility for server-side flag checking
export function getServerSideFeatureFlags(): FeatureFlags {
  try {
    const envFlags = process.env.NEXT_PUBLIC_FEATURE_FLAGS
    if (envFlags) {
      const parsedFlags = JSON.parse(envFlags)
      return { ...DEFAULT_FLAGS, ...parsedFlags }
    }
  } catch (error) {
    console.warn('Failed to parse server-side feature flags:', error)
  }
  
  return DEFAULT_FLAGS
}