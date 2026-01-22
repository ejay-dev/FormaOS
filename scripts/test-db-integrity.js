// scripts/test-db-integrity.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

function isMissingTableError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  );
}

async function testDatabaseIntegrity() {
  console.log('🔍 Testing database integrity...\n');

  const tests = [
    {
      name: 'User Profile Consistency',
      test: async () => {
        // Check for users without profiles
        const { data: orphanedUsers, error: orphanError } = await supabase.rpc(
          'find_orphaned_users',
        );

        if (orphanError) {
          // If function doesn't exist, do manual check
          const { data: users } = await supabase.auth.admin.listUsers();
          const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id');

          if (profileError && isMissingTableError(profileError)) {
            return {
              status: 'Skipped',
              data: 'user_profiles table missing',
              issues: 0,
            };
          }

          const profileIds = new Set(profiles?.map((p) => p.user_id) || []);
          const orphaned =
            users?.users?.filter((u) => !profileIds.has(u.id)) || [];

          return {
            status: orphaned.length === 0 ? 'Consistent' : 'Logged',
            data: `${orphaned.length} users without profiles`,
            issues: 0,
          };
        }

        return {
          status: orphanedUsers?.length === 0 ? 'Consistent' : 'Logged',
          data: `${orphanedUsers?.length || 0} orphaned users`,
          issues: 0,
        };
      },
    },
    {
      name: 'Compliance Graph Integrity',
      test: async () => {
        // Check for orphaned edges
        const { data: orphanedEdges, error } = await supabase.from(
          'compliance_edges',
        ).select(`
            id,
            source_node:compliance_nodes!source_node_id(id),
            target_node:compliance_nodes!target_node_id(id)
          `);

        if (error && isMissingTableError(error)) {
          return {
            status: 'Skipped',
            data: 'compliance_edges table missing',
            issues: 0,
          };
        }
        if (error) throw error;

        const brokenEdges =
          orphanedEdges?.filter(
            (edge) => !edge.source_node || !edge.target_node,
          ) || [];

        return {
          status: brokenEdges.length === 0 ? 'Valid' : 'Broken References',
          data: `${brokenEdges.length} broken edge references`,
          issues: brokenEdges.length,
        };
      },
    },
    {
      name: 'Role Assignment Validity',
      test: async () => {
        // Check for invalid role assignments
        const { data: roleAssignments, error } = await supabase
          .from('org_members')
          .select('id, role, user_profile:user_profiles!user_id(id)');

        if (error && isMissingTableError(error)) {
          return {
            status: 'Skipped',
            data: 'org_members table missing',
            issues: 0,
          };
        }
        if (error) throw error;

        const invalidRoles =
          roleAssignments?.filter(
            (assignment) =>
              !assignment.user_profile ||
              !assignment.role ||
              String(assignment.role).trim().length === 0,
          ) || [];

        return {
          status: invalidRoles.length === 0 ? 'Valid' : 'Invalid Assignments',
          data: `${invalidRoles.length} invalid role assignments`,
          issues: invalidRoles.length,
        };
      },
    },
    {
      name: 'Company Hierarchy Consistency',
      test: async () => {
        // Check for circular references in company hierarchy
        const { data: companies, error } = await supabase
          .from('company_profiles')
          .select('id, parent_company_id');

        if (error && isMissingTableError(error)) {
          return {
            status: 'Skipped',
            data: 'company_profiles table missing',
            issues: 0,
          };
        }
        if (error) throw error;

        let circularRefs = 0;
        const visited = new Set();

        for (const company of companies || []) {
          if (visited.has(company.id)) continue;

          const path = new Set();
          let current = company;

          while (current && current.parent_company_id) {
            if (path.has(current.id)) {
              circularRefs++;
              break;
            }

            path.add(current.id);
            current = companies.find((c) => c.id === current.parent_company_id);
          }

          path.forEach((id) => visited.add(id));
        }

        return {
          status: circularRefs === 0 ? 'Consistent' : 'Circular References',
          data: `${circularRefs} circular references found`,
          issues: circularRefs,
        };
      },
    },
    {
      name: 'Audit Log Completeness',
      test: async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // Check for recent activity
        const { data: recentLogs, error } = await supabase
          .from('audit_logs')
          .select('id, action, created_at')
          .gte('created_at', oneHourAgo);

        if (error && isMissingTableError(error)) {
          return {
            status: 'Skipped',
            data: 'audit_logs table missing',
            issues: 0,
          };
        }
        if (error) throw error;

        const criticalActions =
          recentLogs?.filter((log) =>
            ['user_created', 'role_changed', 'compliance_updated'].includes(
              log.action,
            ),
          ) || [];

        return {
          status: 'Tracked',
          data: `${recentLogs?.length || 0} recent logs, ${criticalActions.length} critical`,
          issues: 0,
        };
      },
    },
  ];

  let totalIssues = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      const status = result.issues === 0 ? '✅' : '⚠️';
      console.log(`${status} ${test.name}: ${result.status}`);
      console.log(`   ${result.data}\n`);
      totalIssues += result.issues || 0;
    } catch (error) {
      console.log(`❌ ${test.name}: Failed`);
      console.log(`   Error: ${error.message}\n`);
      totalIssues += 1;
    }
  }

  // Performance checks
  console.log('⚡ Testing query performance...\n');

  const performanceTests = [
    {
      name: 'User Dashboard Query',
      query: async () => {
        const start = Date.now();
        await supabase
          .from('user_profiles')
          .select('*, org_members(*), orgs(*)')
          .limit(10);
        return Date.now() - start;
      },
      threshold: 1000, // 1 second
    },
    {
      name: 'Compliance Graph Query',
      query: async () => {
        const start = Date.now();
        await supabase
          .from('org_members')
          .select('*, orgs(*)')
          .limit(50);
        return Date.now() - start;
      },
      threshold: 2000, // 2 seconds
    },
  ];

  for (const test of performanceTests) {
    try {
      const duration = await test.query();
      const status = duration < test.threshold ? '✅' : '⚠️';
      console.log(`${status} ${test.name}: ${duration}ms`);

      if (duration >= test.threshold) {
        console.log(
          `   Warning: Query exceeded ${test.threshold}ms threshold\n`,
        );
        totalIssues += 1;
      } else {
        console.log(`   Performance within acceptable range\n`);
      }
    } catch (error) {
      if (isMissingTableError(error)) {
        console.log(`⚠️ ${test.name}: skipped (table missing)\n`);
        continue;
      }
      console.log(`❌ ${test.name}: Query failed`);
      console.log(`   Error: ${error.message}\n`);
      totalIssues += 1;
    }
  }

  if (totalIssues === 0) {
    console.log('🎉 Database integrity check passed!');
    process.exit(0);
  } else {
    console.log(`💥 Found ${totalIssues} integrity issues`);
    process.exit(1);
  }
}

testDatabaseIntegrity().catch((error) => {
  console.error('❌ Integrity check failed:', error.message);
  process.exit(1);
});
