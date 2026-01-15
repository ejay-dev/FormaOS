# FormaOS QA Baseline - January 15, 2026

## Current System Architecture

### Routes & Access Control

**Public Routes:**

- `/` - Marketing landing page
- `/pricing` - Pricing information
- `/auth/signin` - Authentication entry
- `/auth/signup` - User registration
- `/auth/callback` - OAuth callback handler

**Protected Routes:**

- `/app/*` - User dashboard and application
- `/onboarding` - New user setup flow
- `/admin/*` - Founder-only admin console

### User Flow States

```
Anonymous User:
/ → /pricing → /auth/signup → /onboarding → /app/dashboard

Existing User:
/ → /auth/signin → /app/dashboard

Founder User:
/ → /auth/signin → /admin/dashboard
```

### Current Authentication Logic

- **Google OAuth**: Primary authentication method
- **Email/Password**: Secondary authentication method
- **Session Management**: Supabase Auth with Next.js middleware
- **Role Detection**: Based on email matching `FOUNDER_EMAILS`

### Onboarding Behavior (CRITICAL)

**Current State**: NO pricing redirects during onboarding
**Expected Behavior**:

1. User completes signup
2. Redirected to `/onboarding`
3. Multi-step form completion
4. Direct redirect to `/app/dashboard`
5. **NEVER** redirected to `/pricing` during this flow

### Role-Based Dashboard Access

**Admin/Founder Access:**

- User management
- System settings
- Audit logs
- Compliance overview

**Compliance Manager Access:**

- Compliance graph
- Audit reports
- Limited user view

**Employee Access:**

- Personal tasks
- Training modules
- Limited dashboard view

### Node-Wire Graph System

- Interactive compliance node visualization
- Drag-and-drop functionality
- Real-time relationship updates
- Performance-critical component

### Current Dependencies

- **Next.js**: 16.1.1 (App Router)
- **Supabase**: Backend + Auth
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React**: 19.0.0

### Performance Expectations

- **Initial Load**: < 2s
- **Route Navigation**: < 500ms
- **Authentication**: < 1s
- **Graph Rendering**: < 3s

### Security Model

- **RLS Policies**: Row-level security in Supabase
- **JWT Tokens**: Session management
- **CSRF Protection**: Built-in Next.js protection
- **Role-Based Access**: Middleware enforcement
