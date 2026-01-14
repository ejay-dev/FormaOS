# FormaOS API Usage Examples

## JavaScript/TypeScript

### Installation
```bash
npm install @formaos/sdk
# or
yarn add @formaos/sdk
```

### Basic Setup
```typescript
import { FormaOS } from '@formaos/sdk';

const client = new FormaOS({
  apiKey: process.env.FORMAOS_API_KEY,
  baseUrl: 'https://formaos.com/api',
});
```

### Get Organization Overview
```typescript
async function getOrgStats() {
  try {
    const org = await client.organization.getOverview();
    console.log(`Organization: ${org.name}`);
    console.log(`Members: ${org.memberCount}`);
    console.log(`Compliance: ${org.complianceScore}%`);
  } catch (error) {
    if (error.code === 'PERMISSION_DENIED') {
      console.error('You do not have permission to view organization overview');
    }
  }
}

getOrgStats();
```

### List Team Members
```typescript
async function listTeamMembers() {
  const members = await client.members.list({
    limit: 20,
    offset: 0,
    role: 'member', // optional filter
  });

  members.data.forEach((member) => {
    console.log(`${member.email} - ${member.role}`);
  });

  console.log(`Total: ${members.total}`);
}

listTeamMembers();
```

### Invite Team Member
```typescript
async function inviteNewMember() {
  const invitation = await client.members.invite({
    email: 'newuser@company.com',
    role: 'member',
  });

  console.log(`Invitation sent! Expires: ${invitation.expiresAt}`);
}

inviteNewMember();
```

### Get Personal Tasks
```typescript
async function getMyTasks() {
  const tasks = await client.tasks.list();

  const pending = tasks.filter((t) => t.status === 'pending');
  console.log(`You have ${pending.length} pending tasks:`);

  pending.forEach((task) => {
    console.log(`- [${task.priority}] ${task.title} (Due: ${task.dueDate})`);
  });
}

getMyTasks();
```

### Upload Evidence
```typescript
async function uploadCompliance() {
  const result = await client.evidence.upload({
    file: fs.createReadStream('certificate.pdf'),
    title: 'Q1 2026 Compliance Certificate',
    description: 'External audit verification',
  });

  console.log(`Uploaded: ${result.url}`);
}

uploadCompliance();
```

### Error Handling
```typescript
async function handleErrors() {
  try {
    await client.organization.getOverview();
  } catch (error) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        console.error('Your role lacks required permission');
        break;
      case 'UNAUTHORIZED':
        console.error('Invalid or expired authentication');
        break;
      case 'RATE_LIMIT':
        console.error('Too many requests. Try again in:', error.retryAfter, 'seconds');
        break;
      default:
        console.error('API error:', error.message);
    }
  }
}

handleErrors();
```

---

## cURL Examples

### Get Organization Overview
```bash
curl -X GET https://formaos.com/api/org/overview \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

### List Team Members with Pagination
```bash
curl -X GET "https://formaos.com/api/org/members?limit=10&offset=0&role=member" \
  -H "Authorization: Bearer your_jwt_token"
```

### Invite New Member
```bash
curl -X POST https://formaos.com/api/org/members/invite \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "role": "member"
  }'
```

### Upload Evidence File
```bash
curl -X POST https://formaos.com/api/org/evidence \
  -H "Authorization: Bearer your_jwt_token" \
  -F "file=@./certificate.pdf" \
  -F "title=Compliance Certificate" \
  -F "description=Q1 2026 audit"
```

### Get Personal Tasks
```bash
curl -X GET https://formaos.com/api/org/tasks \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Python Examples

### Installation
```bash
pip install formaos
```

### Basic Usage
```python
from formaos import FormaOS

client = FormaOS(api_key='your_api_key')

# Get organization overview
org = client.organization.overview()
print(f"Organization: {org['name']}")
print(f"Members: {org['memberCount']}")

# List team members
members = client.members.list(limit=20, role='member')
for member in members['data']:
    print(f"{member['email']} - {member['role']}")

# Invite new member
invitation = client.members.invite(
    email='newuser@company.com',
    role='member'
)
print(f"Invitation sent! Expires: {invitation['expiresAt']}")
```

### Batch Operations
```python
# Invite multiple members
emails = ['user1@company.com', 'user2@company.com', 'user3@company.com']

for email in emails:
    try:
        result = client.members.invite(email=email, role='member')
        print(f"✓ Invited {email}")
    except Exception as e:
        print(f"✗ Failed to invite {email}: {str(e)}")
```

### Handling Permissions
```python
from formaos.exceptions import PermissionDenied

try:
    org = client.organization.overview()
except PermissionDenied:
    print("You don't have permission to view organization overview")
    print("Your role:", client.get_current_user()['role'])
```

---

## Go Examples

### Installation
```bash
go get github.com/formaos/go-sdk
```

### Basic Usage
```go
package main

import (
    "fmt"
    "log"
    formaos "github.com/formaos/go-sdk"
)

func main() {
    client := formaos.NewClient("your_api_key")

    // Get organization overview
    org, err := client.Organization.Overview()
    if err != nil {
        log.Fatalf("Error: %v", err)
    }
    fmt.Printf("Organization: %s\n", org.Name)
    fmt.Printf("Members: %d\n", org.MemberCount)

    // List team members
    members, err := client.Members.List(&formaos.ListOptions{
        Limit: 20,
        Role:  "member",
    })
    if err != nil {
        log.Fatalf("Error: %v", err)
    }

    for _, member := range members.Data {
        fmt.Printf("%s - %s\n", member.Email, member.Role)
    }
}
```

---

## Real-World Scenarios

### Scenario 1: Automated Compliance Report

```typescript
async function generateComplianceReport() {
  const org = await client.organization.getOverview();
  const members = await client.members.list({ limit: 100 });
  const tasks = await client.tasks.list();

  const report = {
    date: new Date().toISOString(),
    organization: org.name,
    totalMembers: members.total,
    complianceScore: org.complianceScore,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    pendingTasks: tasks.filter((t) => t.status === 'pending').length,
  };

  console.log(JSON.stringify(report, null, 2));
  // Send to email/storage system
}
```

### Scenario 2: Role-Based Access Check

```typescript
async function checkUserPermission(permission: string) {
  const user = await client.auth.getCurrentUser();
  
  const hasPermission = user.permissions.includes(permission);
  
  if (!hasPermission) {
    throw new Error(`User ${user.email} does not have ${permission}`);
  }
  
  return true;
}

// Usage
await checkUserPermission('org:view_overview');
```

### Scenario 3: Batch Member Invite

```typescript
async function inviteTeam(emails: string[], role: string = 'member') {
  const results = [];

  for (const email of emails) {
    try {
      const invitation = await client.members.invite({ email, role });
      results.push({ email, success: true, expiresAt: invitation.expiresAt });
    } catch (error) {
      results.push({ email, success: false, error: error.message });
    }
  }

  return results;
}

// Usage
const results = await inviteTeam(
  ['alice@company.com', 'bob@company.com'],
  'member'
);
console.table(results);
```

### Scenario 4: Export Member Directory

```typescript
async function exportMemberDirectory() {
  const allMembers = [];
  let offset = 0;

  while (true) {
    const batch = await client.members.list({ limit: 100, offset });
    allMembers.push(...batch.data);

    if (batch.data.length < 100) break;
    offset += 100;
  }

  const csv = convertToCSV(allMembers);
  fs.writeFileSync('members.csv', csv);
  console.log(`Exported ${allMembers.length} members`);
}
```

---

## Best Practices

1. **Store API Keys Securely**
   ```typescript
   const apiKey = process.env.FORMAOS_API_KEY; // Never hardcode
   ```

2. **Implement Retry Logic**
   ```typescript
   async function withRetry(fn, maxAttempts = 3) {
     for (let i = 0; i < maxAttempts; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxAttempts - 1) throw error;
         await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   }
   ```

3. **Handle Rate Limits**
   ```typescript
   if (error.code === 'RATE_LIMIT') {
     const retryAfter = error.retryAfter || 60;
     await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
     // Retry request
   }
   ```

4. **Cache When Possible**
   ```typescript
   const cache = new Map();
   
   async function getMembersWithCache() {
     if (cache.has('members')) return cache.get('members');
     
     const members = await client.members.list();
     cache.set('members', members);
     
     // Invalidate after 5 minutes
     setTimeout(() => cache.delete('members'), 5 * 60 * 1000);
     return members;
   }
   ```

---

## Support & Resources

- **Full Documentation:** https://docs.formaos.com
- **API Status Page:** https://status.formaos.com
- **GitHub:** https://github.com/formaos/sdk
- **Email:** api-support@formaos.com
- **Community Forum:** https://community.formaos.com
