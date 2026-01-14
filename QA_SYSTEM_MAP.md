# 🔍 FORMAOS QA AUDIT - PHASE 1: SYSTEM MAP

**Audit Date**: 14 January 2026  
**Status**: Active Audit in Progress  
**Scope**: Complete Enterprise Platform

---

## A. PUBLIC WEBSITE (Marketing)

### Routes & Content
```
/ (home)                          → HomePage()
/pricing                          → PricingPage()
/product                          → ProductPageContent()
/industries                        → IndustriesPageContent()
/security                         → SecurityPageContent()
/contact                          → ContactPageContent()
```

### Data Flow
- ✅ No auth required
- ✅ Marketing content only
- ✅ Stripe pricing widget
- ❓ Contact form submission

### Status
- [ ] Content loads
- [ ] Links work
- [ ] Contact form works
- [ ] Pricing accurate
- [ ] No 404s

---

## B. APP PLATFORM (Authenticated)

### Authentication Layer
```
/auth/signin                      → SignInPage()
/auth/signup                      → SignUpPage()
/auth/callback                    → GET route (OAuth callback)
/auth/plan-select                 → PlanSelectPage()
```

**Key Flows**:
- Google OAuth
- Email/password
- Session persistence
- Token management

**Status**:
- [ ] Google OAuth works
- [ ] Email signup works
- [ ] Session persists
- [ ] Logout clears state
- [ ] No redirect loops

---

### Onboarding System (7-step)
```
/onboarding                       → OnboardingPage()
```

**Steps**:
1. Plan selection
2. Organization setup
3. Industry selection
4. Frameworks selection
5. Compliance scope
6. Team setup
7. Completion

**Status**:
- [ ] All 7 steps work
- [ ] Data persists
- [ ] Completion unlocks app
- [ ] Can skip/backtrack
- [ ] No orphaned data

---

### Core Application Shell
```
/app/                             → AppLayout() + Router
  /app/layout.tsx                 → Protected layout
  /app/error.tsx                  → Error boundary
  /app/app/layout.tsx             → App shell
```

**Features**:
- Sidebar navigation
- TopBar (user/org info)
- Role-based access
- Trial/billing banner
- Command palette

**Status**:
- [ ] Layout renders
- [ ] Sidebar works
- [ ] TopBar displays correctly
- [ ] Banners show (trial/billing)
- [ ] Mobile responsive

---

### Dashboard & Core Pages
```
/app                              → DashboardPage()
  - Metrics display
  - Quick actions
  - Compliance summary
  - Risk assessment

/app/dashboard                    → DashboardAliasPage() (redirect)
```

**Status**:
- [ ] Page loads
- [ ] Data accurate
- [ ] Metrics calculate correctly
- [ ] Performance acceptable
- [ ] No missing data

---

### Governance Modules
```
/app/policies                     → PoliciesPage()
  /app/policies/[id]              → PolicyDetailPage()
  - List, create, edit policies
  - Versioning
  - Publishing workflow

/app/registers                    → RegistersPage()
  /app/registers/training         → TrainingRegisterPage()
  - Training register
  - Compliance records

/app/tasks                        → TasksPage()
  - Compliance tasks
  - Assignments
  - Tracking
```

**Status**:
- [ ] All pages load
- [ ] CRUD operations work
- [ ] Data persists
- [ ] Filtering/search works
- [ ] Performance acceptable

---

### Operations Modules
```
/app/people                       → PeoplePage()
  - Staff/team management
  - Roles and access

/app/patients                     → PatientsPage()
  /app/patients/[id]              → PatientDetailPage()
  - Patient records
  - Medical history

/app/progress-notes               → ProgressNotesPage()
  - Clinical notes
  - Documentation

/app/vault                        → VaultPage()
  /app/vault/review               → CredentialReviewPage()
  - Evidence/credential storage
  - Secure uploads

/app/team                         → TeamPage()
  - Team member management
```

**Status**:
- [ ] All pages accessible
- [ ] Data loads correctly
- [ ] Upload functionality works
- [ ] Permissions enforced
- [ ] No data leaks

---

### Reports & Audit
```
/app/reports                      → ReportsPage()
  - Compliance reports
  - Analytics
  - Export to PDF

/app/audit                        → AuditTrailPage()
  /app/audit/export/[userId]      → AuditExportPage()
  - Audit trail
  - User activity logs
  - Export capability

/app/history                      → HistoryPage()
  - Change history
```

**Status**:
- [ ] Reports generate
- [ ] Data exports work
- [ ] Audit logs accurate
- [ ] Timestamps correct
- [ ] No missing entries

---

### Settings & Profile
```
/app/settings                     → SettingsPage()
  /app/settings/email-preferences → EmailPreferencesPage()
  /app/settings/email-history     → EmailHistoryPage()

/app/profile                      → EmployeeProfilePage()
```

**Status**:
- [ ] Settings load
- [ ] Changes persist
- [ ] Email preferences work
- [ ] Profile editable
- [ ] No validation errors

---

### Billing System
```
/app/billing                      → BillingPage()
  - Current plan display
  - Subscription management
  - Upgrade/downgrade
  - Invoice history
```

**Status**:
- [ ] Billing page loads
- [ ] Plan status correct
- [ ] Stripe integration works
- [ ] Buttons functional
- [ ] Entitlements update

---

### Form Builder
```
/app/forms/builder/[id]           → FormBuilderPage()
  → form-builder-client.tsx       → FormBuilderClient()
  - Custom form creation
  - Field management
```

**Status**:
- [ ] Builder loads
- [ ] Forms can be created
- [ ] Submissions captured
- [ ] Preview works
- [ ] Validation works

---

### Protected Routes
```
/(dashboard)/accept-invite        → AcceptInvitePage()
  - Team invite acceptance
  - Permission assignment

/(dashboard)/organization/[orgId]/audit  → AuditPage()
  - Organization-specific audit
```

**Status**:
- [ ] Invites work
- [ ] Permissions assigned
- [ ] No stale tokens
- [ ] Clear error messages

---

### Special Pages
```
/app/staff                        → StaffDashboardPage()
  - Staff-specific dashboard

/app/admin                        → LegacyAdminPage() (redirect)
/app/admin/orgs/[orgId]           → LegacyAdminOrgPage() (redirect)
  - Legacy admin redirects
```

**Status**:
- [ ] Staff dashboard loads
- [ ] Redirects work
- [ ] No orphaned routes

---

## C. ADMIN CONSOLE (Founder-Only)

### Admin Routes
```
/admin                            → AdminIndex()
/admin/layout.tsx                 → AdminLayout()
```

**Access Control**:
- Founder email verification: `ejazhussaini313@gmail.com`
- Environment variable: `FOUNDER_EMAILS`
- Environment variable: `FOUNDER_USER_IDS`

**Status**:
- [ ] Founder can access
- [ ] Non-founders blocked
- [ ] Clear error messages
- [ ] No privilege escalation

---

### Admin Pages
```
/admin/dashboard                  → (implied overview)
  - System metrics
  - Health indicators

/admin/users                      → AdminUsersPage()
  - User management
  - Deactivation
  - Permission changes

/admin/orgs                       → AdminOrgsPage()
  - Organization management
  - Plan assignment
  - Trial extension

/admin/billing                    → AdminBillingPage()
  - Revenue tracking
  - Subscription status
  - Stripe sync

/admin/revenue                    → AdminRevenuePage()
  - Revenue metrics
  - MRR/ARR
  - Churn analysis

/admin/trials                     → (implied)
  - Trial management
  - Extension logic

/admin/features                   → (implied)
  - Feature toggles
  - Entitlement management

/admin/security                   → (implied)
  - Security settings
  - Logs

/admin/audit                      → AdminAuditPage()
  - Audit trail
  - Admin actions

/admin/support                    → AdminSupportPage()
  - Support requests
  - Issue management

/admin/system                     → (implied)
  - System settings
  - Configuration
```

**Status**:
- [ ] All pages load
- [ ] Data accurate
- [ ] Actions work
- [ ] Changes persist
- [ ] Audit logged

---

## D. API ENDPOINTS (Backend)

### Auth Endpoints
```
POST /api/auth/signin
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/callback (OAuth)
```

### Data Endpoints
```
GET  /api/organizations
POST /api/organizations
PUT  /api/organizations/[id]

GET  /api/org-members
POST /api/org-members
PUT  /api/org-members/[id]

GET  /api/org-subscriptions
POST /api/org-subscriptions
```

### System Endpoints
```
GET  /api/system-state           (NEW - Performance optimization)
GET  /api/health
```

### Admin Endpoints
```
GET  /api/admin/overview
POST /api/admin/orgs/[orgId]/plan
POST /api/admin/orgs/[orgId]/trial
```

**Status**:
- [ ] Endpoints exist
- [ ] Authentication works
- [ ] Permissions enforced
- [ ] Errors handled
- [ ] No 500 errors

---

## E. DATABASE SCHEMA

### Core Tables
```
auth.users                  → Supabase auth users
public.organizations        → Org records
public.org_members          → User-org relationships + roles
public.org_subscriptions    → Stripe subscriptions
public.org_entitlements     → Feature access
```

### Data Tables
```
public.org_policies         → Policy documents
public.org_tasks            → Compliance tasks
public.org_patients         → Patient records
public.org_people           → Staff records
public.org_evidence         → Evidence uploads
```

### Audit Tables
```
public.audit_logs           → Change history
```

**Status**:
- [ ] RLS policies enforce access
- [ ] Data integrity maintained
- [ ] No orphaned records
- [ ] Relationships valid

---

## F. INTEGRATIONS

### Stripe
```
- Checkout sessions
- Subscription webhooks
- Customer portal
- Invoice management
```

**Status**:
- [ ] Keys configured (public + secret)
- [ ] Webhooks working
- [ ] Sync accuracy
- [ ] Error handling

### Supabase
```
- Auth
- Database
- Real-time (subscriptions)
- File storage
```

**Status**:
- [ ] Connection stable
- [ ] RLS enforced
- [ ] Queries optimized
- [ ] Errors handled

### Email (Resend)
```
- Onboarding emails
- Trial expiry warnings
- Billing alerts
- Audit notifications
```

**Status**:
- [ ] Emails send
- [ ] Content accurate
- [ ] Links work
- [ ] No spam

---

## G. ENVIRONMENT & DEPLOYMENT

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

FOUNDER_EMAILS
FOUNDER_USER_IDS

DATABASE_URL (for migrations)
```

**Status**:
- [ ] All vars set
- [ ] No secrets in client code
- [ ] Correct values per environment
- [ ] Webhooks functional

### Deployment
```
- Vercel deployment
- Next.js 16.1.1
- React 19.2.3
- Node 20+
```

**Status**:
- [ ] Builds succeed
- [ ] No errors on deploy
- [ ] Production build works
- [ ] Rollback available

---

## H. CRITICAL DATA FLOWS

### 1. New User Signup
```
User → Signup form
     → Email verification (or OAuth)
     → Create org + membership
     → Onboarding flow
     → Trial activation
     → First login
```

### 2. Trial to Paid
```
Trial user → Billing page
          → Plan selection
          → Stripe checkout
          → Webhook received
          → Subscription active
          → Entitlements updated
          → Feature access granted
```

### 3. Role-Based Access
```
User → Assigned role
    → Permissions cached
    → API checks role
    → UI hides restricted features
    → Page content matches role
```

### 4. Admin Action
```
Founder → /admin
        → Verify access
        → Load organization data
        → Modify settings
        → Audit log entry
        → Changes persist
```

---

## I. RISK ASSESSMENT

### Critical (Must Work)
- ✅ Auth / OAuth flow
- ✅ Onboarding completion
- ✅ Trial system activation
- ✅ Billing/Stripe integration
- ✅ Admin isolation
- ✅ Role enforcement
- ✅ Data persistence

### High (Must Not Break)
- ✅ Page navigation
- ✅ Sidebar functionality
- ✅ Mobile responsiveness
- ✅ Performance <150ms per route
- ✅ Error messages clear
- ✅ Session persistence

### Medium (Nice to Have)
- ✅ Visual consistency
- ✅ Loading indicators
- ✅ Analytics tracking
- ✅ Email notifications
- ✅ Audit trail completeness

---

## TEST MATRIX

| Area | Tests | Status |
|------|-------|--------|
| Auth | OAuth, Email, Sessions | ⚪ Pending |
| Onboarding | 7-step flow, Data persistence | ⚪ Pending |
| Trial | Activation, Warnings, Expiry | ⚪ Pending |
| Billing | Plans, Upgrades, Stripe sync | ⚪ Pending |
| Roles | Owner, Admin, Member, Viewer | ⚪ Pending |
| Admin | Isolation, Founder check, Actions | ⚪ Pending |
| Pages | Load time, Data accuracy | ⚪ Pending |
| Errors | Fallbacks, Messages | ⚪ Pending |
| Performance | Network, CPU, Render time | ⚪ Pending |
| Security | RLS, Secrets, Access control | ⚪ Pending |

---

**NEXT**: PHASE 2 - Functional QA Testing

Generated: 14 January 2026
