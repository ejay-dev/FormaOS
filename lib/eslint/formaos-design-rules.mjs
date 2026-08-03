/**
 * =========================================================
 * FORMAOS DESIGN TOKEN ENFORCEMENT
 * =========================================================
 *
 * Custom ESLint rules to prevent design drift by flagging
 * hardcoded colors and enforcing semantic token usage.
 *
 * Rules:
 * - no-hardcoded-colors: Warns on bg-[#xxx], text-[#xxx], and raw hex in className
 * - prefer-semantic-tokens: Suggests semantic alternatives for raw Tailwind palette colors
 */

/** @type {import('eslint').Rule.RuleModule} */
const noHardcodedColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded hex colors in Tailwind classes',
      category: 'Design System',
    },
    messages: {
      noHardcodedHex:
        'Avoid hardcoded hex color "{{color}}" in className. Use a semantic token instead (e.g., bg-background, text-muted-foreground, bg-marketing-bg).',
    },
    schema: [],
  },
  create(context) {
    // Match arbitrary Tailwind hex values like bg-[#xxx], from-[#xxx], text-[#xxx]
    const ARBITRARY_HEX_PATTERN =
      /(?:bg|text|from|via|to|border|ring|shadow|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g;

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className' || !node.value) {
          return;
        }

        // Handle string literals
        if (
          node.value.type === 'Literal' &&
          typeof node.value.value === 'string'
        ) {
          const matches = node.value.value.matchAll(ARBITRARY_HEX_PATTERN);
          for (const match of matches) {
            context.report({
              node: node.value,
              messageId: 'noHardcodedHex',
              data: { color: match[0] },
            });
          }
        }

        // Handle template literals in expressions
        if (node.value.type === 'JSXExpressionContainer') {
          checkExpression(
            node.value.expression,
            context,
            ARBITRARY_HEX_PATTERN,
          );
        }
      },
    };
  },
};

function checkExpression(node, context, pattern) {
  if (!node) return;

  if (node.type === 'TemplateLiteral') {
    for (const quasi of node.quasis) {
      const matches = quasi.value.raw.matchAll(pattern);
      for (const match of matches) {
        context.report({
          node: quasi,
          messageId: 'noHardcodedHex',
          data: { color: match[0] },
        });
      }
    }
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    const matches = node.value.matchAll(pattern);
    for (const match of matches) {
      context.report({
        node,
        messageId: 'noHardcodedHex',
        data: { color: match[0] },
      });
    }
  }

  // Check cn() calls and template strings in CallExpressions
  if (node.type === 'CallExpression') {
    for (const arg of node.arguments) {
      checkExpression(arg, context, pattern);
    }
  }
}

/**
 * =========================================================
 * NO ADMIN+ORG FILTER (Audit 2026-05-26)
 * =========================================================
 *
 * Flags the legacy pattern:
 *
 *   const admin = createSupabaseAdminClient();
 *   admin.from('org_tasks').select('*').eq('organization_id', orgId);
 *
 * Since FORCE RLS is enabled on tenant tables, missing a single `.eq()`
 * on the admin client leaks rows across tenants (service-role bypasses
 * RLS). The wrapper `createSupabaseOrgClient(orgId)` (in
 * `lib/supabase/org-scoped.ts`) makes the org filter structural — it
 * appends `.eq(<orgColumn>, orgId)` automatically and panics if the
 * caller touches a table not registered as tenant-scoped.
 *
 * This rule warns when a file pairs the admin client with an
 * `.eq('org_id', ...)` or `.eq('organization_id', ...)` filter,
 * suggesting migration to the org-scoped client.
 *
 * Intentional admin-client usage on org-scoped tables (cron jobs,
 * cross-tenant scans, security detection) should disable this rule
 * inline with a justifying comment:
 *
 *   // eslint-disable-next-line formaos/no-admin-client-with-org-filter
 *   // Reason: cross-tenant scan for the nightly billing reconciliation.
 *   const admin = createSupabaseAdminClient();
 */

/** @type {import('eslint').Rule.RuleModule} */
const noAdminClientWithOrgFilter = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Discourage createSupabaseAdminClient paired with .eq(organization_id|org_id) — use createSupabaseOrgClient instead',
      category: 'Tenant Isolation',
    },
    messages: {
      preferOrgClient:
        'This file pairs createSupabaseAdminClient with .eq(\'{{column}}\', ...). ' +
        'Prefer createSupabaseOrgClient(orgId) from @/lib/supabase/org-scoped — it stamps the org filter structurally so a missed .eq() cannot leak cross-tenant. ' +
        'If admin access is intentional (cron / cross-tenant scan), add an `eslint-disable-next-line` with a justifying comment.',
    },
    schema: [],
  },
  create(context) {
    let usesAdminClient = false;
    let adminClientNode = null;
    const orgFilterCalls = [];

    return {
      // Detect `createSupabaseAdminClient(` call sites.
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee &&
          callee.type === 'Identifier' &&
          callee.name === 'createSupabaseAdminClient'
        ) {
          usesAdminClient = true;
          adminClientNode = node;
        }

        // Detect `.eq('organization_id', ...)` or `.eq('org_id', ...)`.
        if (
          callee &&
          callee.type === 'MemberExpression' &&
          callee.property &&
          callee.property.name === 'eq' &&
          node.arguments &&
          node.arguments.length >= 1 &&
          node.arguments[0].type === 'Literal' &&
          (node.arguments[0].value === 'organization_id' ||
            node.arguments[0].value === 'org_id')
        ) {
          orgFilterCalls.push({
            node,
            column: node.arguments[0].value,
          });
        }
      },

      // At end of program, report if both patterns appeared.
      'Program:exit'() {
        if (!usesAdminClient || orgFilterCalls.length === 0) return;
        for (const call of orgFilterCalls) {
          context.report({
            node: call.node,
            messageId: 'preferOrgClient',
            data: { column: call.column },
          });
        }
        // The admin-client call itself is also worth flagging once.
        if (adminClientNode) {
          context.report({
            node: adminClientNode,
            messageId: 'preferOrgClient',
            data: { column: orgFilterCalls[0].column },
          });
        }
      },
    };
  },
};

/**
 * P0-10 (2026-05-26): ban Math.random in security-critical code paths.
 * Math.random is not cryptographically strong; using it to mint
 * identifiers in rate-limit buckets, session marker cookies, scratch
 * keys, or sampling decisions in security flows leaks predictable
 * structure to an attacker. Force crypto.randomUUID / randomInt /
 * randomBytes instead. Scope is enforced per-file via the
 * `files` glob in eslint.config.mjs — this rule itself is path-agnostic.
 */
/** @type {import('eslint').Rule.RuleModule} */
const noMathRandom = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Math.random() — use crypto.randomUUID/randomInt/randomBytes for any value that needs to be unpredictable.',
      category: 'Security',
    },
    messages: {
      noMathRandom:
        'Math.random() is not cryptographically secure. Use crypto.randomUUID(), crypto.randomInt(), or crypto.getRandomValues() instead.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object &&
          node.object.type === 'Identifier' &&
          node.object.name === 'Math' &&
          node.property &&
          node.property.type === 'Identifier' &&
          node.property.name === 'random'
        ) {
          context.report({ node, messageId: 'noMathRandom' });
        }
      },
    };
  },
};

/**
 * Audit 2026-08-02 — the single most common defect class in this codebase.
 *
 * supabase-js RESOLVES with `{ data, error }`; it does not reject. So
 *
 *   await supabase.from('org_notifications').insert({ ... });
 *
 * fails completely silently when the table, a column, or a constraint does not
 * match — and this schema has drifted a lot. That one habit is why notifications
 * were never delivered, automation triggers never fired, audit reports came back
 * empty, and org suspend/retire reported success while doing nothing. Each read
 * as a separate bug; they were one missing `if (error)`.
 *
 * Reports a write whose `error` is provably never looked at:
 *   - the result is discarded entirely (expression statement), or
 *   - it is destructured without taking `error`.
 *
 * Deliberately NOT reported: assigning to a plain identifier
 * (`const res = await ...`), because the rule cannot see whether `res.error` is
 * checked later, and a false positive here would train people to disable it.
 * `.throwOnError()` anywhere in the chain also satisfies the rule.
 */
const SUPABASE_WRITE_METHODS = new Set(['insert', 'update', 'upsert', 'delete', 'rpc']);

/** @type {import('eslint').Rule.RuleModule} */
const noUncheckedSupabaseError = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the `error` of a Supabase write to be checked — supabase-js resolves with { data, error } instead of rejecting, so an unchecked write fails silently.',
      category: 'Correctness',
    },
    messages: {
      unchecked:
        'Unchecked Supabase {{method}}(): supabase-js resolves with { data, error } and never rejects, so this failure is silent. Destructure `error` and handle it, or add .throwOnError().',
    },
    schema: [],
  },
  create(context) {
    /** Walk up a `.from(x).update(y).eq(...)` chain to its outermost call. */
    function outermostCall(node) {
      let current = node;
      for (;;) {
        const parent = current.parent;
        if (parent && parent.type === 'MemberExpression' && parent.object === current) {
          current = parent;
          continue;
        }
        if (parent && parent.type === 'CallExpression' && parent.callee === current) {
          current = parent;
          continue;
        }
        return current;
      }
    }

    function chainText(node) {
      return context.sourceCode
        ? context.sourceCode.getText(node)
        : context.getSourceCode().getText(node);
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== 'MemberExpression') return;
        if (!callee.property || callee.property.type !== 'Identifier') return;

        const method = callee.property.name;
        if (!SUPABASE_WRITE_METHODS.has(method)) return;

        const chain = outermostCall(node);
        const text = chainText(chain);

        // Only Supabase query builders: a `.from(` earlier in the chain, or a
        // direct `.rpc(`. Keeps Array.prototype.delete-alikes and unrelated
        // `update()` helpers out of scope.
        if (method !== 'rpc' && !/\.from\s*\(/.test(text)) return;
        if (!/\b(supabase|admin|db|client|sb)\b/i.test(text) && !/\.from\s*\(/.test(text)) return;
        if (/\.throwOnError\s*\(/.test(text)) return;

        const awaited = chain.parent;
        if (!awaited || awaited.type !== 'AwaitExpression') return;

        const parent = awaited.parent;
        if (!parent) return;

        // `await supabase.from('t').insert(...)` — result thrown away.
        if (parent.type === 'ExpressionStatement') {
          context.report({ node: callee.property, messageId: 'unchecked', data: { method } });
          return;
        }

        // `const { data } = await ...` — destructured without `error`.
        if (parent.type === 'VariableDeclarator' && parent.id.type === 'ObjectPattern') {
          const takesError = parent.id.properties.some(
            (p) =>
              (p.type === 'Property' && p.key && p.key.type === 'Identifier' && p.key.name === 'error') ||
              p.type === 'RestElement',
          );
          if (!takesError) {
            context.report({ node: callee.property, messageId: 'unchecked', data: { method } });
          }
        }
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-admin-client-with-org-filter': noAdminClientWithOrgFilter,
    'no-math-random': noMathRandom,
    'no-unchecked-supabase-error': noUncheckedSupabaseError,
  },
};

export default plugin;
