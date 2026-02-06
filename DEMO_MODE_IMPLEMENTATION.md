# Guided Demo Mode - Implementation Guide

**Implementation Date:** February 6, 2026
**Status:** ✅ Complete - Ready for Integration

---

## Overview

Interactive guided product tour that demonstrates FormaOS automation and compliance workflows to new users and demo visitors. Includes step-by-step walkthrough, auto-populated demo data, and marketing entry points.

**Key Features:**
- 6-step interactive walkthrough with UI element highlighting
- Auto-seeding of realistic demo data
- Persistent demo mode banner
- Multiple entry points (marketing, dashboard, onboarding)
- Safe demo environment (no real data affected)
- Session-based state management

---

## Components Created

### 1. Demo Context Provider
**File:** `lib/demo/demo-context.tsx`

**Purpose:** Centralized state management for demo mode

**API:**
```typescript
const {
  isDemoMode,           // boolean - is demo currently active
  currentStep,          // number - current walkthrough step (0-5)
  totalSteps,           // number - total steps (6)
  isWalkthroughActive,  // boolean - is walkthrough overlay showing
  startDemo,            // () => void - enter demo mode
  exitDemo,             // () => void - exit demo mode
  restartDemo,          // () => void - restart from step 0
  nextStep,             // () => void - go to next step
  prevStep,             // () => void - go to previous step
  skipWalkthrough,      // () => void - close walkthrough but stay in demo
  goToStep,             // (step: number) => void - jump to specific step
} = useDemo();
```

**State Persistence:**
- Uses `sessionStorage` for demo state
- Persists across page navigation within session
- Clears on browser close or demo exit

---

### 2. Walkthrough Overlay
**File:** `components/demo/WalkthroughOverlay.tsx`

**Purpose:** Interactive step-by-step tour with UI highlighting

**Features:**
- Backdrop overlay with spotlight cutout
- Animated pointer indicating target element
- Floating tooltip card with step info
- Progress dots (6 steps)
- Next/Back/Skip navigation
- Auto-scrolls to highlighted element

**Walkthrough Steps:**

| Step | Title | Target | Description |
|------|-------|--------|-------------|
| 0 | Compliance Health Score | `.compliance-score-widget` | Real-time 0-100 score from controls, evidence, tasks, policies |
| 1 | Automation Timeline | `.automation-timeline` | FormaOS working automatically - tasks, notifications, reminders |
| 2 | Evidence Vault | `.evidence-section` | Evidence repository with auto-expiry tracking |
| 3 | Task Automation | `.tasks-section` | Auto-generated tasks with escalations and recurring |
| 4 | Policy Lifecycle | `.policies-section` | 180-day review cycle with auto-notifications |
| 5 | Controls & Reporting | `.controls-section` | Real-time control health with auto-remediation |

**Target Selectors:**
Components must add these CSS classes when in demo mode:
- `.compliance-score-widget` - Compliance score display
- `.automation-timeline` - Activity timeline
- `.evidence-section` - Evidence vault section
- `.tasks-section` - Tasks section
- `.policies-section` - Policies section
- `.controls-section` - Controls section

---

### 3. Demo Banner
**File:** `components/demo/DemoBanner.tsx`

**Purpose:** Persistent banner indicating demo mode is active

**Features:**
- Purple/blue gradient banner at top of screen
- "You are viewing FormaOS Demo Mode" message
- Restart Demo button
- Exit Demo button
- Auto-hides when demo mode is off
- Fixed positioning (z-index: 50)

**Visual Design:**
- Full-width gradient background
- Sparkles icon
- White text with high contrast
- Clear action buttons

---

### 4. Demo Mode Toggle
**File:** `components/demo/DemoModeToggle.tsx`

**Purpose:** Button to enter guided demo mode

**Props:**
```typescript
interface DemoModeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onDemoStart?: () => void; // Optional callback before demo starts
}
```

**Usage:**
```tsx
import { DemoModeToggle } from '@/components/demo';

// Simple usage
<DemoModeToggle />

// With custom styling
<DemoModeToggle
  variant="outline"
  size="lg"
  className="my-custom-class"
/>

// With callback to seed data
<DemoModeToggle
  onDemoStart={async () => {
    await seedDemoData();
  }}
/>
```

**States:**
- **Inactive:** "Enter Guided Demo Mode" with Play icon
- **Starting:** "Starting Demo..." with loading spinner
- **Active:** "Demo Active" with purple badge and pulse

---

### 5. Watch Demo CTA
**File:** `components/demo/WatchDemoCTA.tsx`

**Purpose:** Marketing call-to-action to launch demo instantly

**Variants:**

**Large (Premium Card):**
```tsx
<WatchDemoCTA variant="large" />
```
- Full-width card with gradient background
- Decorative elements
- "See FormaOS Automation in Action" headline
- Feature bullets
- Large CTA button

**Default (Button):**
```tsx
<WatchDemoCTA />
```
- Outlined button with purple border
- "Watch FormaOS Work" text
- Play icon

**Inline (Link):**
```tsx
<WatchDemoCTA variant="inline" />
```
- Text link with purple color
- Inline with other content
- Arrow icon

**Behavior:**
- Sets demo mode in sessionStorage
- Redirects to `/app/dashboard`
- Demo auto-starts on dashboard load

---

### 6. Demo Data Manager
**File:** `components/demo/DemoDataManager.tsx`

**Purpose:** Auto-populates demo data when demo mode activates

**Features:**
- Automatically seeds data on demo start
- Calls `/api/demo/seed` endpoint
- Only seeds once per session
- Cleanup on demo exit
- Silent component (no UI)

**Integration:**
```tsx
import { DemoDataManager } from '@/components/demo';

// Add to root layout or dashboard
<DemoProvider>
  <DemoDataManager />
  {children}
</DemoProvider>
```

---

### 7. Demo Dashboard Wrapper
**File:** `components/demo/DemoDashboardWrapper.tsx`

**Purpose:** Adds target classes to dashboard sections for walkthrough

**Usage:**
```tsx
import { DemoDashboardWrapper } from '@/components/demo';

// Wrap each dashboard section
<DemoDashboardWrapper section="score">
  <ComplianceDashboardWidget />
</DemoDashboardWrapper>

<DemoDashboardWrapper section="timeline">
  <AutomationTimeline />
</DemoDashboardWrapper>
```

**Sections:**
- `score` → `.compliance-score-widget`
- `timeline` → `.automation-timeline`
- `evidence` → `.evidence-section`
- `tasks` → `.tasks-section`
- `policies` → `.policies-section`
- `controls` → `.controls-section`

---

### 8. Demo Seed API
**File:** `app/api/demo/seed/route.ts`

**Purpose:** Backend endpoint to populate demo data

**Endpoint:** `POST /api/demo/seed`

**Request Body:**
```json
{
  "organizationId": "org-uuid",
  "eventsCount": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "stats": {
    "organization": "Demo Corp",
    "workflowExecutions": 15,
    "complianceScore": 82,
    "riskLevel": "low"
  }
}
```

**What It Seeds:**
- 15 workflow executions (last 48 hours)
- Compliance score evaluation (75-90 range)
- Demo workflow (if not exists)
- Mix of trigger types (7 types)
- 90% success rate, 10% failures

---

## Integration Guide

### Step 1: Add Demo Provider to Root Layout

```tsx
// app/layout.tsx or app/app/layout.tsx
import { DemoProvider } from '@/components/demo';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
```

### Step 2: Add Demo Components to Dashboard

```tsx
// app/app/dashboard/page.tsx
import {
  DemoBanner,
  WalkthroughOverlay,
  DemoDataManager,
  DemoDashboardWrapper,
} from '@/components/demo';
import {
  ComplianceDashboardWidget,
  AutomationTimeline,
} from '@/components/automation';

export default function DashboardPage() {
  return (
    <>
      {/* Demo mode banner (shows only when demo active) */}
      <DemoBanner />

      {/* Auto-seed demo data */}
      <DemoDataManager />

      {/* Interactive walkthrough overlay */}
      <WalkthroughOverlay />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Wrap sections with demo wrappers */}
        <DemoDashboardWrapper section="score">
          <ComplianceDashboardWidget />
        </DemoDashboardWrapper>

        <DemoDashboardWrapper section="timeline">
          <AutomationTimeline limit={10} />
        </DemoDashboardWrapper>
      </div>

      {/* Other sections... */}
    </>
  );
}
```

### Step 3: Add Demo Toggle to Dashboard

```tsx
// In dashboard header or settings
import { DemoModeToggle } from '@/components/demo';

<DemoModeToggle variant="outline" size="sm" />
```

### Step 4: Add Marketing CTA to Homepage

```tsx
// app/(marketing)/page.tsx
import { WatchDemoCTA } from '@/components/demo';

export default function HomePage() {
  return (
    <>
      {/* Hero section */}
      <section>
        <h1>FormaOS - Compliance Operating System</h1>
        <p>Automate compliance workflows...</p>

        {/* Demo CTA */}
        <WatchDemoCTA variant="large" />
      </section>

      {/* Or inline in features section */}
      <p>
        Want to see it in action? <WatchDemoCTA variant="inline" />
      </p>
    </>
  );
}
```

### Step 5: Add Demo Toggle to Onboarding

```tsx
// app/app/onboarding/complete/page.tsx
import { DemoModeToggle } from '@/components/demo';

export default function OnboardingCompletePage() {
  return (
    <div>
      <h1>Welcome to FormaOS!</h1>
      <p>Your compliance operating system is ready.</p>

      {/* Demo toggle */}
      <DemoModeToggle size="lg" />
    </div>
  );
}
```

---

## Demo Safety Features

### 1. Session Isolation
- Demo state stored in `sessionStorage` (not `localStorage`)
- Clears on browser close
- No persistent storage

### 2. Data Separation
- Demo data tagged with "Demo Automation Workflow"
- Easy to identify and filter
- Can be cleaned up via admin tools

### 3. Organization Isolation
- Demo uses specific organization ID
- No cross-contamination with real orgs
- RLS policies still enforced

### 4. Read-Only Demo Mode
- Walkthrough is view-only
- No write operations during tour
- Can't modify real data while in demo

### 5. Exit Anytime
- Clear "Exit Demo" button always visible
- Session cleanup on exit
- Returns to normal mode instantly

---

## User Flow

### Marketing Site Entry:
1. User clicks "Watch FormaOS Work" on homepage
2. Demo mode set in sessionStorage
3. Redirect to `/app/dashboard`
4. Dashboard loads with demo mode active
5. Auto-seed demo data
6. Walkthrough overlay appears
7. User follows 6-step tour

### Dashboard Entry:
1. User clicks "Enter Guided Demo Mode" button
2. Demo mode activates
3. Auto-seed demo data (if needed)
4. Walkthrough overlay appears
5. User follows tour
6. Can exit or restart anytime

### Onboarding Entry:
1. User completes onboarding
2. Sees "Enter Guided Demo Mode" option
3. Clicks to activate
4. Walkthrough starts
5. Learns FormaOS features interactively

---

## Customization

### Change Walkthrough Steps

Edit `WALKTHROUGH_STEPS` in `components/demo/WalkthroughOverlay.tsx`:

```typescript
const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 0,
    title: 'Custom Step Title',
    description: 'Custom description...',
    targetSelector: '.custom-target-class',
    icon: CustomIcon,
    position: 'right',
  },
  // ... more steps
];
```

### Adjust Demo Data Volume

Modify `eventsCount` in API call:

```typescript
// In DemoDataManager.tsx
body: JSON.stringify({
  organizationId: demoOrgId,
  eventsCount: 25, // Increase for more events
}),
```

### Change Demo Banner Style

Edit `components/demo/DemoBanner.tsx`:

```tsx
<div className="... bg-gradient-to-r from-green-600 to-teal-600">
  {/* Custom styling */}
</div>
```

### Custom CTA Variants

Add new variant to `WatchDemoCTA.tsx`:

```typescript
if (variant === 'custom') {
  return (
    <button>Custom Demo CTA</button>
  );
}
```

---

## Analytics & Tracking

### Track Demo Starts
```typescript
// In demo-context.tsx startDemo()
const startDemo = () => {
  setIsDemoMode(true);
  setCurrentStep(0);
  setIsWalkthroughActive(true);

  // Track analytics
  analytics.track('Demo Started', {
    source: 'dashboard', // or 'marketing', 'onboarding'
    timestamp: new Date().toISOString(),
  });
};
```

### Track Step Progression
```typescript
// In nextStep()
const nextStep = () => {
  if (currentStep < DEMO_STEPS - 1) {
    setCurrentStep((prev) => prev + 1);

    // Track analytics
    analytics.track('Demo Step Viewed', {
      step: currentStep + 1,
      stepTitle: WALKTHROUGH_STEPS[currentStep + 1].title,
    });
  }
};
```

### Track Demo Completion
```typescript
// In nextStep() when completing final step
if (currentStep === totalSteps - 1) {
  analytics.track('Demo Completed', {
    duration: getDemoDuration(),
    stepsViewed: totalSteps,
  });
}
```

---

## Testing

### Unit Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { DemoProvider, useDemo } from '@/lib/demo/demo-context';

describe('Demo Mode', () => {
  it('starts demo mode', () => {
    const { result } = renderHook(() => useDemo(), {
      wrapper: DemoProvider,
    });

    act(() => {
      result.current.startDemo();
    });

    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });
});
```

### Integration Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoModeToggle } from '@/components/demo';

describe('DemoModeToggle', () => {
  it('starts demo on click', async () => {
    render(<DemoModeToggle />);

    const button = screen.getByText(/Enter Guided Demo Mode/i);
    fireEvent.click(button);

    expect(sessionStorage.getItem('formaos_demo_mode')).toBe('true');
  });
});
```

### E2E Tests
```typescript
test('complete demo walkthrough', async ({ page }) => {
  await page.goto('/app/dashboard');

  // Start demo
  await page.click('button:has-text("Enter Guided Demo Mode")');

  // Verify walkthrough appears
  await expect(page.locator('.walkthrough-overlay')).toBeVisible();

  // Complete all steps
  for (let i = 0; i < 6; i++) {
    await page.click('button:has-text("Next")');
  }

  // Verify demo completes
  await expect(page.locator('.walkthrough-overlay')).not.toBeVisible();
});
```

---

## Troubleshooting

### Walkthrough Not Appearing
**Issue:** Overlay doesn't show after clicking demo toggle
**Fix:**
- Verify `DemoProvider` wraps entire app
- Check `WalkthroughOverlay` is rendered
- Ensure sessionStorage is accessible

### Target Elements Not Highlighted
**Issue:** Spotlight doesn't appear on elements
**Fix:**
- Add correct CSS classes to dashboard sections
- Use `DemoDashboardWrapper` to wrap sections
- Verify selectors match in `WALKTHROUGH_STEPS`

### Demo Data Not Seeding
**Issue:** No demo events appear
**Fix:**
- Check demo org ID in sessionStorage
- Verify `/api/demo/seed` endpoint is accessible
- Check console for errors
- Ensure organization exists in database

### Banner Not Showing
**Issue:** Demo banner doesn't appear
**Fix:**
- Verify `DemoBanner` is rendered
- Check `isDemoMode` state is true
- Ensure z-index is high enough (50)

---

## Performance Considerations

### Lazy Loading
- Walkthrough overlay only renders when active
- Banner only renders when demo mode is on
- No performance impact when demo is inactive

### Session Storage
- Lightweight state storage
- No database queries for demo state
- Fast state restoration

### Demo Data Volume
- Default 15 events (configurable)
- Minimal database impact
- Can adjust based on needs

---

## Files Created

**Components (7 files):**
1. `lib/demo/demo-context.tsx` - State management
2. `components/demo/WalkthroughOverlay.tsx` - Interactive tour
3. `components/demo/DemoBanner.tsx` - Demo mode banner
4. `components/demo/DemoModeToggle.tsx` - Toggle button
5. `components/demo/WatchDemoCTA.tsx` - Marketing CTA
6. `components/demo/DemoDataManager.tsx` - Auto-seed manager
7. `components/demo/DemoDashboardWrapper.tsx` - Section wrapper

**API (1 file):**
8. `app/api/demo/seed/route.ts` - Demo data endpoint

**Infrastructure (1 file):**
9. `components/demo/index.ts` - Centralized exports

**Documentation (1 file):**
10. `DEMO_MODE_IMPLEMENTATION.md` (this file)

**Total:** 10 new files
**Lines of Code:** ~1,100

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features Used:**
- SessionStorage API
- CSS Animations
- React Hooks
- Absolute positioning

---

## Next Steps

### Immediate
1. ✅ Integrate `DemoProvider` into root layout
2. ✅ Add demo components to dashboard
3. ✅ Add marketing CTAs to homepage
4. ✅ Test complete demo flow
5. ✅ Set demo organization ID

### Short-Term (1-2 Weeks)
- Add analytics tracking to demo events
- A/B test different CTA copy
- Collect user feedback on walkthrough
- Add more detailed tooltips
- Video tutorial alongside walkthrough

### Medium-Term (1-3 Months)
- Multi-language support for walkthrough
- Industry-specific demo scenarios
- Custom demo paths based on user role
- Demo progress saving (resume later)
- Interactive challenges within demo

---

**Status:** ✅ Complete - Ready for Production Integration
**Version:** 1.0.0
**Implementation Date:** February 6, 2026
