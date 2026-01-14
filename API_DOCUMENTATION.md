# FormaOS API Documentation

## Overview

Complete API reference with role-based access control, authentication, and usage examples.

**Base URL:** `https://formaos.com/api`  
**Authentication:** Bearer token (JWT) in Authorization header

---

## Authentication

### User Session

All API requests require authentication via Supabase JWT:

```bash
Authorization: Bearer <your_jwt_token>
```

### Role Validation

Your role determines what endpoints and data you can access. Roles: `owner`, `admin`, `member`, `viewer`

---

## Core Endpoints

### 1. Organization Overview

**GET** `/api/org/overview`

- **Access:** `owner`, `admin`
- **Permissions Required:** `org:view_overview`
- **Response Time:** < 500ms

Returns organization metrics, team stats, and compliance overview.

```bash
curl -X GET https://formaos.com/api/org/overview \
  -H "Authorization: Bearer your_jwt_token"
```

**Response (200):**

```json
{
  "orgId": "org-123",
  "name": "ACME Corp",
  "memberCount": 45,
  "certificateCount": 120,
  "complianceScore": 92,
  "lastAudit": "2026-01-10T14:30:00Z",
  "modules": {
    "my_compliance": "active",
    "org_overview": "active",
    "team_management": "active",
    "billing": "active"
  }
}
```

**Error (403):**

```json
{
  "error": "PERMISSION_DENIED",
  "message": "Members cannot view organization overview"
}
```

---

### 2. Get Team Members

**GET** `/api/org/members`

- **Access:** `owner`, `admin`
- **Permissions Required:** `team:view_all_members`
- **Query Parameters:**
  - `limit` (optional): Results per page (default: 20, max: 100)
  - `offset` (optional): Pagination offset (default: 0)
  - `role` (optional): Filter by role (owner|admin|member|viewer)

```bash
curl -X GET "https://formaos.com/api/org/members?limit=10&role=member" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response (200):**

```json
{
  "members": [
    {
      "id": "user-123",
      "email": "alice@acme.com",
      "role": "admin",
      "joinedAt": "2025-06-15T08:00:00Z",
      "lastActive": "2026-01-14T10:30:00Z",
      "permissions": [
        "org:view_overview",
        "team:invite_members",
        "team:remove_members"
      ]
    },
    {
      "id": "user-456",
      "email": "bob@acme.com",
      "role": "member",
      "joinedAt": "2025-09-01T12:00:00Z",
      "lastActive": "2026-01-12T15:45:00Z",
      "permissions": ["cert:view_own", "evidence:upload_own"]
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

---

### 3. Get Personal Tasks

**GET** `/api/org/tasks`

- **Access:** All authenticated users
- **Permissions Required:** `task:view_assigned`
- **Returns:** Tasks assigned to the authenticated user

```bash
curl -X GET https://formaos.com/api/org/tasks \
  -H "Authorization: Bearer your_jwt_token"
```

**Response (200):**

```json
{
  "tasks": [
    {
      "id": "task-789",
      "title": "Complete Q1 Compliance Review",
      "assignedTo": "you@company.com",
      "dueDate": "2026-02-15T23:59:59Z",
      "status": "in_progress",
      "priority": "high",
      "createdAt": "2026-01-10T09:00:00Z"
    }
  ],
  "total": 3
}
```

---

### 4. View Personal Compliance

**GET** `/api/org/my/compliance`

- **Access:** All authenticated users
- **Permissions Required:** `compliance:view_own`
- **Returns:** Only user's own compliance data

```bash
curl -X GET https://formaos.com/api/org/my/compliance \
  -H "Authorization: Bearer your_jwt_token"
```

**Response (200):**

```json
{
  "userId": "you@company.com",
  "complianceStatus": "compliant",
  "certificatesSent": 12,
  "certificatesCompleted": 10,
  "completionRate": 83.3,
  "lastUpdated": "2026-01-12T10:00:00Z"
}
```

---

### 5. Upload Evidence

**POST** `/api/org/evidence`

- **Access:** `admin`, `member` (own evidence only)
- **Permissions Required:** `evidence:create` or `evidence:upload_own`
- **Content-Type:** multipart/form-data

```bash
curl -X POST https://formaos.com/api/org/evidence \
  -H "Authorization: Bearer your_jwt_token" \
  -F "file=@certificate.pdf" \
  -F "title=Compliance Certificate" \
  -F "description=Q1 2026 audit"
```

**Response (201):**

```json
{
  "id": "evidence-456",
  "title": "Compliance Certificate",
  "url": "https://vault.formaos.com/evidence-456",
  "uploadedAt": "2026-01-14T11:30:00Z",
  "uploadedBy": "you@company.com",
  "status": "verified"
}
```

**Error (413):**

```json
{
  "error": "FILE_TOO_LARGE",
  "message": "Maximum file size is 50MB"
}
```

---

### 6. Invite Team Member

**POST** `/api/org/members/invite`

- **Access:** `owner`, `admin`
- **Permissions Required:** `team:invite_members`

```bash
curl -X POST https://formaos.com/api/org/members/invite \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "role": "member"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "message": "Invitation sent to newuser@company.com",
  "inviteId": "invite-789",
  "expiresAt": "2026-02-14T11:30:00Z"
}
```

---

### 7. Change Member Role

**PATCH** `/api/org/members/{userId}/role`

- **Access:** `owner`, `admin`
- **Permissions Required:** `team:change_roles`

```bash
curl -X PATCH https://formaos.com/api/org/members/user-456/role \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"newRole": "admin"}'
```

**Response (200):**

```json
{
  "userId": "user-456",
  "oldRole": "member",
  "newRole": "admin",
  "changedAt": "2026-01-14T11:30:00Z",
  "changedBy": "you@company.com"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2026-01-14T11:30:00Z"
}
```

### Common Error Codes

| Code                | Status | Description                               |
| ------------------- | ------ | ----------------------------------------- |
| `PERMISSION_DENIED` | 403    | Your role lacks required permission       |
| `UNAUTHORIZED`      | 401    | Invalid or expired authentication         |
| `NOT_FOUND`         | 404    | Resource does not exist                   |
| `CONFLICT`          | 409    | Resource already exists or state conflict |
| `VALIDATION_ERROR`  | 400    | Invalid request parameters                |
| `RATE_LIMIT`        | 429    | Too many requests (100/min per user)      |
| `INTERNAL_ERROR`    | 500    | Server error                              |

---

## Role-Based Access Control

### Permission Matrix

| Permission              | Owner | Admin | Member | Viewer |
| ----------------------- | ----- | ----- | ------ | ------ |
| `org:view_overview`     | ✅    | ✅    | ❌     | ❌     |
| `org:manage_settings`   | ✅    | ❌    | ❌     | ❌     |
| `team:view_all_members` | ✅    | ✅    | ❌     | ❌     |
| `team:invite_members`   | ✅    | ✅    | ❌     | ❌     |
| `team:change_roles`     | ✅    | ❌    | ❌     | ❌     |
| `cert:view_all`         | ✅    | ✅    | ❌     | ❌     |
| `cert:view_own`         | ✅    | ✅    | ✅     | ✅     |
| `cert:create`           | ✅    | ✅    | ❌     | ❌     |
| `evidence:view_own`     | ✅    | ✅    | ✅     | ✅     |
| `evidence:upload_own`   | ✅    | ✅    | ✅     | ❌     |
| `task:view_assigned`    | ✅    | ✅    | ✅     | ✅     |
| `compliance:view_own`   | ✅    | ✅    | ✅     | ✅     |
| `billing:view`          | ✅    | ❌    | ❌     | ❌     |
| `audit_logs:view`       | ✅    | ✅    | ❌     | ❌     |

---

## Rate Limiting

All endpoints are rate limited:

- **Authenticated Users:** 100 requests/minute
- **Per Endpoint:** 30 requests/minute
- **Bulk Operations:** 10 requests/minute

Rate limit headers in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642164000
```

---

## Pagination

Endpoints that return lists support pagination:

```bash
curl "https://formaos.com/api/org/members?limit=20&offset=0"
```

**Parameters:**

- `limit`: Results per page (1-100, default: 20)
- `offset`: Number of results to skip (default: 0)

**Response includes:**

```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## Webhooks (Coming Soon)

Subscribe to events like role changes, member invites, and compliance updates.

```bash
POST /api/webhooks/subscribe
```

---

## SDK Support

- **JavaScript/TypeScript** - `npm install @formaos/sdk`
- **Python** - `pip install formaos`
- **Go** - `go get github.com/formaos/go-sdk`

---

## Support

- **API Status:** https://status.formaos.com
- **Documentation:** https://docs.formaos.com
- **Email:** api-support@formaos.com
- **Community:** https://community.formaos.com
