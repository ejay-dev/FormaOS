# FormaOS Admin Console - Quick Reference Guide

## 🚀 Getting Started

### Accessing the Admin Console
1. Navigate to `http://localhost:3000/admin`
2. You'll be redirected to `/signin` if not authenticated
3. Sign in with Google OAuth using the founder email: `ejazhussaini313@gmail.com`
4. After authentication, you'll have access to all admin pages

### Navigation
- **Top Bar**: Logo, Health Status, Founder Email, Logout button
- **Left Sidebar**: 8 navigation items (Dashboard, Users, Orgs, Billing, Health, Revenue, Audit Logs, Settings)
- **Mobile**: Hamburger menu button opens/closes sidebar overlay

## 📊 Dashboard (`/admin`)

**Purpose**: Real-time platform metrics overview

**Key Metrics**:
- **Total Organizations**: All tenant accounts on platform
- **Active Trials**: Organizations currently in trial period
- **Monthly Recurring**: Estimated MRR across all paid subscriptions
- **Starter/Pro/Failed Payments**: Subscription breakdowns

**Charts**:
- **Organization Growth**: 14-day historical trend
- **Plan Distribution**: Percentage split by plan tier (Starter/Pro/Enterprise)

**Actions**:
- View metrics
- Monitor platform health
- Identify trends

## 👥 Users (`/admin/users`)

**Purpose**: Manage platform users and access

**Table Columns**:
- User (email with provider)
- Organization (assigned org)
- Role (user role in org)
- Provider (OAuth provider - Google)
- Last Login (timestamp)
- Status (Verified/Pending)
- Actions (manage user)

**Search**:
- Search by email or name
- Click "Search" button to filter

**Actions Available**:
- View user details
- Promote/Demote role
- Disable account
- Resend confirmation email

## 🏢 Organizations (`/admin/orgs`)

**Purpose**: Manage tenant organizations

**Table Columns**:
- Organization (org name with icon)
- Owner (owner email)
- Plan (color-coded badge: Purple/Emerald/Blue)
- Status (Active/Trialing/Suspended)
- Trial Expires (date or —)
- Actions (org control)

**Status Colors**:
- 🟢 Emerald: Active
- 🟡 Amber: Trialing
- 🔴 Red: Suspended

**Actions Available**:
- View org details
- Lock/Suspend org
- Force upgrade/downgrade plan
- View entitlements
- Impersonate org (force login)

## 💳 Billing (`/admin/billing`)

**Purpose**: Subscription and revenue oversight

**Metric Cards**:
- Active Subscriptions: Number of paying orgs
- Active Trials: Organizations in trial
- Payment Issues: Failed payment attempts

**Table Columns**:
- Organization (tenant name)
- Status (Active/Trialing/Past Due)
- Plan (color-coded: Starter/Pro/Enterprise)
- Trial Ends (expiration date)
- Stripe ID (Stripe subscription reference)
- Actions (billing control)

**Actions Available**:
- Cancel subscription
- Pause billing
- Extend trial period
- View invoices
- Update payment method

## 🏥 Health (`/admin/health`)

**Purpose**: Monitor system operational status

**Status Cards**:
- All Systems Operational: Current system state
- Last Check: Most recent health check timestamp

**Billing Events**:
- Timeline of billing-related events
- Event types include: webhooks, invoice generation, payment processing
- Icons indicate success (✓) or error (⚠)

**Admin Activity**:
- Timeline of founder actions
- Tracks: permission changes, org updates, user modifications
- Each entry shows actor, action type, target resource, timestamp

## 💰 Revenue (`/admin/revenue`)

**Purpose**: Revenue metrics and financial overview

**Main Metric**:
- **Estimated MRR**: Total monthly recurring revenue across all subscriptions

**Plan Breakdown**:
- **Starter**: Number of subscriptions + revenue amount
- **Pro**: Number of subscriptions + revenue amount
- **Enterprise**: Custom pricing (counts shown)

**Summary Section**:
- Total Active Subscriptions
- Total Estimated Monthly Revenue

**Formula**:
- Starter: $49.99/month × count
- Pro: $99.99/month × count
- Enterprise: Custom (shown as 0)

## 📋 Audit Logs (`/admin/audit`)

**Purpose**: Complete activity trail of all admin actions

**Log Entries Display**:
- **Timestamp**: When action occurred
- **Actor**: Who performed the action (founder email)
- **Action**: What was done (create/update/delete/suspend)
- **Target**: What resource was affected (org ID, user ID, etc.)
- **IP Address**: Where action originated
- **Metadata**: Additional context

**Pagination**:
- Load 20 entries per page
- Use pagination controls to navigate
- Most recent entries shown first

**Use Cases**:
- Compliance auditing
- Troubleshooting changes
- Security investigation
- Activity verification

## ⚙️ Settings (`/admin/settings`)

**Purpose**: Admin console configuration and documentation

**Current Configuration Section**:
- Shows founder access status
- OAuth provider details (Google via Supabase)
- Service Role Key status (cross-org visibility)

**Environment Variables**:
- Lists required configuration
- Shows current founder email setting

**Access Control**:
- Explains route guard protection
- Documents API endpoint security
- Notes authorization checks

**Security Reminders**:
- Never share founder credentials
- All actions are audited
- Session tokens expire
- Use VPN for production access

## 🔐 Security & Access Control

### Who Can Access?
- **Only**: Founder with email `ejazhussaini313@gmail.com`
- **Via**: Supabase OAuth (Google)
- **Protected**: All routes and API endpoints

### What's Protected?
- Route: `/admin/*` - Server-side verification
- API: `/api/admin/*` - Endpoint-level auth
- Database: RLS policies with service role key

### Audit Trail
- All founder actions logged
- Stored in `audit_logs` table
- Viewable in `/admin/audit` page

## 🚨 Common Tasks

### Check Organization Health
1. Go to `/admin`
2. View KPI cards for overview
3. If issues, go to `/admin/billing` to check subscription status
4. View `/admin/audit` for recent changes

### Investigate Failed Payment
1. Go to `/admin/billing`
2. Look for "Payment Issues" metric
3. Check subscriptions table for status "Past Due"
4. Click Actions → View Invoices
5. Contact customer or retry payment

### Monitor Platform Growth
1. Go to `/admin`
2. View "Total Organizations" card
3. Check "Organization Growth" chart for 14-day trend
4. View "Plan Distribution" for breakdown

### Review Admin Activity
1. Go to `/admin/audit`
2. Scroll through activity timeline
3. Filter by founder actions if needed
4. Timestamp shows exactly when actions occurred

### Manage User Access
1. Go to `/admin/users`
2. Search for user by email
3. Click Actions
4. Promote/Demote role
5. Or disable account if needed

### Extend Trial for Customer
1. Go to `/admin/orgs`
2. Search for organization
3. Click Actions
4. Select "Extend Trial"
5. Choose new end date
6. Confirm

## 📱 Mobile Usage

### On Mobile Devices
1. Hamburger menu in top-left opens sidebar
2. Sidebar overlays content
3. Click outside sidebar to close
4. Tables scroll horizontally
5. KPI cards stack vertically

### Touch Friendly
- Large tap targets (44px minimum)
- Proper spacing between buttons
- Easy to navigate with one hand

## 🔍 Troubleshooting

### Can't Access Admin Console?
- Check you're signed in with correct founder email
- Verify OAuth credentials
- Check NEXT_PUBLIC_FOUNDER_EMAIL in environment

### Data Not Loading?
- Check network connection
- Refresh page (F5)
- Check browser console for errors
- Verify Supabase connection

### Page Slow to Load?
- Check browser performance tab
- Verify database query performance
- Check network latency

### Metrics Wrong?
- Refresh page
- Check database directly
- Review /admin/audit for recent changes

## 💡 Tips & Best Practices

1. **Regular Checks**: Review `/admin` dashboard daily for platform health
2. **Monitor Trials**: Check expiring trials in `/admin/billing` weekly
3. **Review Activity**: Check `/admin/audit` for unauthorized changes
4. **Backup**: Export important data regularly
5. **Test Changes**: Make changes on test orgs first
6. **Document Actions**: Note major changes in audit trail
7. **Security**: Log out when done
8. **VPN**: Use VPN for production access

## 📞 Support

### Common Issues

**Issue**: "Unauthorized" error
- **Solution**: Sign in with correct founder email

**Issue**: "Data unavailable" message
- **Solution**: Refresh page, check network connection

**Issue**: Actions not working
- **Solution**: Check browser console for errors, verify permissions

**Issue**: Charts not showing
- **Solution**: Ensure at least 2 orgs/subscriptions exist for data

## 📖 Additional Resources

- `ADMIN_CONSOLE_COMPLETE.md` - Full technical documentation
- `ADMIN_CONSOLE_VERIFICATION.md` - Implementation details
- `SESSION_COMPLETION_SUMMARY.md` - Development history

---

**Last Updated**: Session Complete
**Status**: Production Ready ✅
