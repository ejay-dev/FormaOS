import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Healthcare & NDIS Positioning Verification', () => {
  test.describe.configure({ timeout: 60_000 });

  // ============================================
  // HEALTHCARE PAGE TESTS
  // ============================================

  test('Healthcare page loads with correct hero messaging', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Check hero section
    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();
    expect(h1Text).toContain('AHPRA-Aligned');
    expect(h1Text).toContain('Healthcare Compliance');

    // Check hero subtitle mentions patient management and evidence
    const heroSubtitle = page.locator(
      'text=Complete compliance management for medical practices',
    );
    await expect(heroSubtitle).toBeVisible();
  });

  test('Healthcare page highlights patient management as key differentiator', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Look for patient management system section
    const patientMgmtTitle = page.locator('text=Patient Management System');
    await expect(patientMgmtTitle).toBeVisible();

    // Verify it mentions risk levels and HIPAA
    const patientMgmtSection = patientMgmtTitle.locator('..', {
      has: page.locator(
        'text=Complete patient records with care status tracking',
      ),
    });
    await expect(patientMgmtSection).toBeVisible();
  });

  test('Healthcare page highlights progress notes as evidence generator', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Look for progress notes section
    const progressNotesTitle = page.locator(
      'text=Progress Notes & Clinical Documentation',
    );
    await expect(progressNotesTitle).toBeVisible();

    // Verify evidence generation messaging
    const evidenceText = page.locator(
      'text=Structured progress notes automatically become audit evidence',
    );
    await expect(evidenceText).toBeVisible();

    // Verify sign-off workflow is mentioned
    const signOffText = page.locator('text=Sign-off workflows, status tagging');
    await expect(signOffText).toBeVisible();
  });

  test('Healthcare page shows evidence management with patient linking', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Look for evidence management section
    const evidenceMgmt = page.locator('text=Patient-linked evidence tracking');
    await expect(evidenceMgmt).toBeVisible();

    // Verify automatic control mapping is mentioned
    const autoMapping = page.locator(
      'text=Every progress note, incident, and task completion automatically tagged',
    );
    await expect(autoMapping).toBeVisible();
  });

  test('Healthcare page shows patient care to evidence workflow', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Look for the workflow section
    const workflowSection = page.locator(
      'text=Patient Care & Progress Notes (Evidence Generation)',
    );
    await expect(workflowSection).toBeVisible();

    // Verify workflow steps show evidence generation
    const autoLinked = page.locator(
      'text=Note automatically linked to compliance framework controls',
    );
    await expect(autoLinked).toBeVisible();

    const becomesEvidence = page.locator('text=Note becomes audit evidence');
    await expect(becomesEvidence).toBeVisible();
  });

  test('Healthcare page CTA routes to correct signup', async ({ page }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });

    // Find the first "Start Free Trial" button
    const ctaButton = page.locator('text=Start Free Trial').first();

    // Check that it has correct href with plan
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('/auth/signup');
    expect(href).toContain('plan=pro');
  });

  // ============================================
  // NDIS PAGE TESTS
  // ============================================

  test('NDIS page loads with correct hero messaging', async ({ page }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Check hero section
    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();
    expect(h1Text).toContain('NDIS Practice Standards');
    expect(h1Text).toContain('Made Simple');
  });

  test('NDIS page highlights participant management with evidence linking', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Look for participant management section
    const participantMgmt = page.locator('text=Participant Management');
    await expect(participantMgmt).toBeVisible();

    // Verify evidence linking is mentioned
    const evidenceLinked = page.locator(
      'text=Evidence-linked tracking automatically supports NDIS audits',
    );
    await expect(evidenceLinked).toBeVisible();
  });

  test('NDIS page shows incident auto-mapping to regulations', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Look for incident section
    const incidentSection = page.locator('text=Incident & Safeguarding');
    await expect(incidentSection).toBeVisible();

    // Verify NDIS Commission mapping (use .first() as text appears in multiple sections)
    const regulatoryMapping = page
      .locator('text=Auto-mapped to NDIS Quality & Safeguards Commission')
      .first();
    await expect(regulatoryMapping).toBeVisible();
  });

  test('NDIS page shows quality & audit with evidence auto-generation', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Look for quality section
    const qualitySection = page.locator('text=Quality & Audit');
    await expect(qualitySection).toBeVisible();

    // Verify automatic evidence generation
    const autoEvidence = page.locator(
      'text=All participant-related actions automatically become audit evidence',
    );
    await expect(autoEvidence).toBeVisible();
  });

  test('NDIS page shows participant care workflow', async ({ page }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Look for workflow section
    const workflowSection = page.locator(
      'text=Participant Care & Evidence Generation',
    );
    await expect(workflowSection).toBeVisible();

    // Verify workflow steps
    const careUpdates = page.locator(
      'text=Workers log participant interactions',
    );
    await expect(careUpdates).toBeVisible();

    const linkedToStandards = page.locator(
      'text=automatically linked to NDIS Practice Standards controls',
    );
    await expect(linkedToStandards).toBeVisible();
  });

  test('NDIS page CTA routes to correct signup', async ({ page }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });

    // Find the first "Start Free Trial" button
    const ctaButton = page.locator('text=Start Free Trial').first();

    // Check that it has correct href with plan
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('/auth/signup');
    expect(href).toContain('plan=pro');
  });

  // ============================================
  // HOME PAGE HEALTHCARE SECTION TESTS
  // ============================================

  test('Home page healthcare section mentions evidence generation', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Wait for client hydration

    // Look for healthcare section - scroll down to see it
    const healthcareSection = page.locator(
      'text=Patient management with automatic audit evidence generation',
    );
    await healthcareSection.scrollIntoViewIfNeeded();
    await expect(healthcareSection).toBeVisible();
  });

  test('Home page shows progress notes as evidence proof', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Wait for client hydration

    // Look for the progress notes mention
    const progressNotes = page.locator(
      'text=Progress notes become compliance proof',
    );
    await progressNotes.scrollIntoViewIfNeeded();
    await expect(progressNotes).toBeVisible();
  });

  test('Home page highlights NDIS controls pre-configured', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Wait for client hydration

    // Look for NDIS framework mention
    const ndisControls = page.locator(
      'text=NDIS Practice Standards 1-8 controls pre-configured',
    );
    await ndisControls.scrollIntoViewIfNeeded();
    await expect(ndisControls).toBeVisible();
  });

  // ============================================
  // PRODUCT PAGE HEALTHCARE EXAMPLES TESTS
  // ============================================

  test('Product page Operationalize section includes healthcare workflows', async ({
    page,
  }) => {
    await page.goto(`${BASE}/product`, { waitUntil: 'domcontentloaded' });

    // Look for operationalize section (use heading role to be specific)
    const operationalizeTitle = page.getByRole('heading', {
      name: 'Operationalize',
    });
    await expect(operationalizeTitle).toBeVisible();

    // Verify healthcare workflow examples are present
    const healthcareWorkflow = page.locator(
      'text=Healthcare workflows: Progress notes auto-generate compliance evidence',
    );
    await expect(healthcareWorkflow).toBeVisible();

    // Verify patient tracking is mentioned
    const patientTracking = page.locator(
      'text=Patient/participant tracking: All care updates linked to compliance controls',
    );
    await expect(patientTracking).toBeVisible();
  });

  test('Product page operationalize outcome mentions patient care integration', async ({
    page,
  }) => {
    await page.goto(`${BASE}/product`, { waitUntil: 'networkidle' });

    // Find the operationalize outcome text
    const outcome = page.locator(
      'text=Patient care and regulatory evidence happen together, not separately',
    );
    await expect(outcome).toBeVisible();
  });

  // ============================================
  // PRICING PAGE HEALTHCARE FEATURES TESTS
  // ============================================

  test('Pricing page lists patient management in Professional tier', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded' });

    // Look for professional tier and scroll to it
    const professionalTier = page.locator('text=Professional').first();
    await professionalTier.scrollIntoViewIfNeeded();
    await expect(professionalTier).toBeVisible();

    // Verify patient management is listed (scroll to make visible)
    const patientMgmt = page.locator(
      'text=Patient management system with risk levels',
    );
    await patientMgmt.scrollIntoViewIfNeeded();
    await expect(patientMgmt).toBeVisible();
  });

  test('Pricing page lists progress notes in Professional tier', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded' });

    // Look for progress notes feature (scroll to make visible)
    const progressNotes = page.locator(
      'text=Progress notes with automatic compliance evidence generation',
    );
    await progressNotes.scrollIntoViewIfNeeded();
    await expect(progressNotes).toBeVisible();
  });

  test('Pricing page comparison shows progress notes as FormaOS feature', async ({
    page,
  }) => {
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded' });

    // Scroll down to comparison table
    const progressNotesFeature = page.locator(
      'text=Progress Notes & Auditable Care Documentation',
    );
    await progressNotesFeature.scrollIntoViewIfNeeded();
    await expect(progressNotesFeature).toBeVisible();

    // Verify FormaOS has check mark
    const formaosFeatureRow = progressNotesFeature.locator('..');
    const formaosCheck = formaosFeatureRow.locator('text=✅ Included');
    await expect(formaosCheck).toBeVisible();
  });

  // ============================================
  // CONSISTENCY TESTS
  // ============================================

  test('Healthcare and NDIS pages use consistent messaging', async ({
    page,
  }) => {
    // Check healthcare page
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });
    const healthcareEvidenceText = await page
      .locator('text=automatically become audit evidence')
      .first()
      .textContent();

    // Check NDIS page
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });
    const ndisEvidenceText = await page
      .locator('text=automatically become audit evidence')
      .first()
      .textContent();

    // Both should have similar evidence messaging
    expect(healthcareEvidenceText).toBeTruthy();
    expect(ndisEvidenceText).toBeTruthy();
  });

  test('All healthcare CTAs point to same signup plan', async ({ page }) => {
    // Check home page - use link role to find actual anchor elements
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const homeCtaHref = await page
      .getByRole('link', { name: 'Start Free Trial' })
      .first()
      .getAttribute('href');

    // Check healthcare page
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'networkidle',
    });
    const healthcareCtaHref = await page
      .getByRole('link', { name: 'Start Free Trial' })
      .first()
      .getAttribute('href');

    // Check NDIS page
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'networkidle',
    });
    const ndisCtaHref = await page
      .getByRole('link', { name: 'Start Free Trial' })
      .first()
      .getAttribute('href');

    // All should route to pro plan
    expect(homeCtaHref).toContain('plan=pro');
    expect(healthcareCtaHref).toContain('plan=pro');
    expect(ndisCtaHref).toContain('plan=pro');
  });
});
