# FormaOS Environment Setup Guide

## Development Environment

### Prerequisites
- Node.js 18+ or later
- npm or yarn package manager
- Git
- VS Code (recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/ejay-dev/FormaOS.git
cd FormaOS
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Authentication
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
AUTH_SECRET=your_random_secret_here_minimum_32_chars

# Redis (Optional, for caching)
REDIS_URL=redis://localhost:6379

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your_datadog_key

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
```

### Step 4: Get Supabase Credentials

1. Go to https://app.supabase.com
2. Create new project or select existing
3. Settings → API Keys
4. Copy `URL` and `anon key` to `.env.local`

### Step 5: Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 in browser.

---

## Production Environment

### `.env.production`

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key_here

# Authentication
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://formaos.com/auth/callback
AUTH_SECRET=production_random_secret_minimum_32_chars

# Redis
REDIS_URL=redis://prod-redis.internal:6379

# Monitoring
SENTRY_DSN=https://your-prod-sentry-dsn
DATADOG_API_KEY=prod_datadog_key

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# Performance
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
```

### Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select project → Settings → Environment Variables
3. Add all production variables
4. Set environment scopes:
   - `Production` for main branch
   - `Preview` for staging
   - `Development` for local

---

## Staging Environment

### `.env.staging`

```bash
# Supabase Configuration (Staging)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key_here

# Authentication
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://staging.formaos.com/auth/callback
AUTH_SECRET=staging_random_secret_minimum_32_chars

# Redis
REDIS_URL=redis://staging-redis.internal:6379

# Monitoring
SENTRY_DSN=https://your-staging-sentry-dsn
DATADOG_API_KEY=staging_datadog_key

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
```

---

## Docker Setup

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Build and Run
```bash
# Build image
docker build -t formaos:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  formaos:latest

# Or with docker-compose
docker-compose up
```

---

## Database Setup

### Supabase Schema

```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create org_members table
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their organization
CREATE POLICY "users_can_see_own_org"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
  ));

-- Policy: Users can only see members in their organization
CREATE POLICY "users_can_see_org_members"
  ON org_members FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
  ));
```

---

## Script: Quick Setup

### `scripts/setup.sh`

```bash
#!/bin/bash

echo "🚀 FormaOS Development Setup"
echo "=============================="

# Check Node.js version
echo "✓ Checking Node.js..."
node --version

# Install dependencies
echo "✓ Installing dependencies..."
npm install

# Setup environment
echo "✓ Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "⚠ Created .env.local - please update with your Supabase credentials"
else
  echo "✓ .env.local already exists"
fi

# Run migrations
echo "✓ Running database setup..."
npm run db:setup || true

# Start development server
echo ""
echo "✅ Setup complete!"
echo "Run 'npm run dev' to start development server"
echo "Open http://localhost:3000 in your browser"
```

### Run Setup Script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Supabase connection fails

**Checklist:**
- ✓ Verify SUPABASE_URL is correct
- ✓ Verify SUPABASE_ANON_KEY is correct
- ✓ Check internet connection
- ✓ Verify Supabase project is active

```bash
# Test connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/
```

### Issue: Authentication fails

**Solution:**
- Verify AUTH_SECRET is set (32+ random characters)
- Check callback URL matches Supabase config
- Clear browser cookies and try again

### Issue: Redis connection error

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it
redis-server
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench (macOS)
brew install httpd

# Test dashboard endpoint
ab -n 1000 -c 10 http://localhost:3000/app

# Results show:
# - Requests per second
# - Mean time per request
# - Failed requests
```

### Monitor Memory Usage

```bash
# Watch process memory
top -p $(lsof -t -i :3000)

# Or with Node.js
node --inspect=0.0.0.0:9229 node_modules/.bin/next start
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Build passes locally: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No console errors: `npm run lint`
- [ ] Database migrations applied
- [ ] Supabase RLS policies enabled
- [ ] Monitoring configured (Sentry/DataDog)
- [ ] SSL certificate valid
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## Common Tasks

### Update Dependencies
```bash
npm update
npm audit fix
```

### Run Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Generate Build Report
```bash
npm run build
npm run build-stats
```

### Clean Build
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **FormaOS Docs:** https://docs.formaos.com
- **GitHub Issues:** https://github.com/ejay-dev/FormaOS/issues
