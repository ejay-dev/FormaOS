# CLAIM-TO-SYSTEM AUDIT: MISMATCHES

## ❌ ADVERTISED BUT NOT IMPLEMENTED

| Website Claim / Feature                    | File / Module | Notes                                                                                         |
| ------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------- |
| Turn obligations into executable workflows | —             | No explicit workflow engine/module found. Workflows are implied but not directly implemented. |
| Automated incident management              | —             | No incident management module or workflow found in app code.                                  |

## ⚠️ IMPLEMENTED BUT NOT MARKETED

| Feature / Module                                      | File / Module                               | Notes                                           |
| ----------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| Evidence quality scoring and AI summary               | app/app/actions/evidence-intelligence.ts    | Not mentioned in marketing, but present in app. |
| Live audit stream (real-time audit log UI)            | components/dashboard/audit-stream.tsx       | Not highlighted in marketing.                   |
| Team compliance table (org-wide compliance breakdown) | components/dashboard/employer-dashboard.tsx | Not highlighted in marketing.                   |
