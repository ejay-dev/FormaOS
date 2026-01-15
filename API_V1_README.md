# FormaOS REST API v1 Documentation

## Overview

FormaOS provides a RESTful API for programmatic access to compliance data, tasks, evidence, and audit logs.

**Base URL:** `https://app.formaos.com.au/api/v1`  
**Authentication:** Bearer token (Supabase JWT)  
**Rate Limits:** 60-100 requests per minute depending on endpoint  
**Format:** JSON

---

## Authentication

All API requests require authentication via Supabase JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Getting Your API Token

1. Sign in to FormaOS web app
2. Open browser developer console
3. Run: `localStorage.getItem('sb-<project-id>-auth-token')`
4. Extract the `access_token` field from the JSON

---

## Endpoints

### GET /api/v1/tasks

List tasks assigned to the authenticated user.

**Rate Limit:** 100 requests/minute

**Query Parameters:**

- `status` (optional): Filter by status (`pending`, `in_progress`, `completed`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `critical`)
- `limit` (optional): Max results (default: 50, max: 100)

**Example Request:**

```bash
curl -X GET "https://app.formaos.com.au/api/v1/tasks?status=pending&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "tasks": [
    {
      "id": "task-123",
      "title": "Complete Q1 Compliance Review",
      "description": "Review all Q1 evidence and controls",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-02-15T23:59:59Z",
      "assigned_to": "user-456",
      "created_at": "2026-01-10T09:00:00Z",
      "updated_at": "2026-01-12T14:30:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "status": "pending",
  "priority": "all"
}
```

---

### GET /api/v1/evidence

List evidence artifacts for your organization.

**Rate Limit:** 100 requests/minute

**Query Parameters:**

- `status` (optional): Filter by verification status (`pending`, `verified`, `rejected`)
- `taskId` (optional): Filter by associated task ID
- `limit` (optional): Max results (default: 50, max: 100)

**Example Request:**

```bash
curl -X GET "https://app.formaos.com.au/api/v1/evidence?status=verified" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "evidence": [
    {
      "id": "evidence-789",
      "title": "ISO 27001 Certificate",
      "file_name": "iso27001_2026.pdf",
      "file_type": "application/pdf",
      "file_size": 2048576,
      "verification_status": "verified",
      "uploaded_by": "user-123",
      "verified_by": "user-456",
      "verified_at": "2026-01-14T16:20:00Z",
      "task_id": "task-123",
      "created_at": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "status": "verified",
  "taskId": null
}
```

---

### GET /api/v1/compliance

Get organization-wide compliance metrics.

**Rate Limit:** 60 requests/minute

**Query Parameters:** None

**Example Request:**

```bash
curl -X GET "https://app.formaos.com.au/api/v1/compliance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "organizationId": "org-123",
  "complianceScore": 87,
  "riskLevel": "LOW",
  "complianceTrend": "UP",
  "policies": {
    "total": 45,
    "active": 42,
    "coverageRate": 93.3
  },
  "tasks": {
    "total": 127,
    "completed": 115,
    "pending": 10,
    "overdue": 2,
    "completionRate": 90.6
  },
  "evidence": {
    "collected": 256,
    "required": 280,
    "completionRate": 91.4
  },
  "anomalies": [],
  "lastUpdated": "2026-01-15T12:00:00Z"
}
```

---

### GET /api/v1/audit-logs

List immutable audit log entries.

**Rate Limit:** 60 requests/minute

**Query Parameters:**

- `action` (optional): Filter by action type (e.g., `EVIDENCE_UPLOADED`, `TASK_CREATED`)
- `startDate` (optional): Filter logs after this ISO 8601 date
- `endDate` (optional): Filter logs before this ISO 8601 date
- `limit` (optional): Max results (default: 50, max: 200)

**Example Request:**

```bash
curl -X GET "https://app.formaos.com.au/api/v1/audit-logs?action=EVIDENCE_UPLOADED&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "logs": [
    {
      "id": "log-456",
      "action": "EVIDENCE_UPLOADED",
      "target": "evidence:evidence-789",
      "actor_email": "user@company.com",
      "domain": "compliance",
      "severity": "low",
      "metadata": {
        "file_name": "iso27001_2026.pdf",
        "file_size": 2048576
      },
      "created_at": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "filters": {
    "action": "EVIDENCE_UPLOADED",
    "startDate": null,
    "endDate": null
  }
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized - Bearer token required"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

**Response Headers:**

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (on 429 errors)

---

## Rate Limits

| Endpoint             | Rate Limit          |
| -------------------- | ------------------- |
| `/api/v1/tasks`      | 100 requests/minute |
| `/api/v1/evidence`   | 100 requests/minute |
| `/api/v1/compliance` | 60 requests/minute  |
| `/api/v1/audit-logs` | 60 requests/minute  |

Rate limits are enforced per user (authenticated) or per IP address (unauthenticated).

---

## Security

- **TLS 1.3:** All API traffic encrypted in transit
- **Row-Level Security:** Supabase RLS automatically filters data by organization
- **Token Expiry:** JWT tokens expire after 1 hour (refresh required)
- **Audit Logging:** All API requests are logged

---

## Code Examples

### Node.js / TypeScript

```typescript
import fetch from 'node-fetch';

const API_BASE = 'https://app.formaos.com.au/api/v1';
const token = process.env.FORMAOS_API_TOKEN;

async function getTasks() {
  const response = await fetch(`${API_BASE}/tasks?status=pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

getTasks().then((data) => {
  console.log(`Found ${data.total} pending tasks`);
  data.tasks.forEach((task) => {
    console.log(`- ${task.title} (due: ${task.due_date})`);
  });
});
```

### Python

```python
import requests
import os

API_BASE = 'https://app.formaos.com.au/api/v1'
token = os.getenv('FORMAOS_API_TOKEN')

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get pending tasks
response = requests.get(f'{API_BASE}/tasks?status=pending', headers=headers)
response.raise_for_status()
data = response.json()

print(f"Found {data['total']} pending tasks")
for task in data['tasks']:
    print(f"- {task['title']} (due: {task['due_date']})")
```

### cURL

```bash
# Set your token
export TOKEN="your_jwt_token_here"

# Get pending tasks
curl -X GET "https://app.formaos.com.au/api/v1/tasks?status=pending" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Get compliance metrics
curl -X GET "https://app.formaos.com.au/api/v1/compliance" \
  -H "Authorization: Bearer $TOKEN"

# Get recent audit logs
curl -X GET "https://app.formaos.com.au/api/v1/audit-logs?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Support

For API questions or issues:

- Email: support@formaos.com.au
- Slack: #api-support (Enterprise customers)
- Documentation: https://docs.formaos.com.au

---

## Changelog

### v1.0.0 (January 2026)

- Initial release
- READ-only endpoints for tasks, evidence, compliance, audit logs
- Token authentication
- Rate limiting
- Comprehensive error handling
