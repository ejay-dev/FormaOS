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

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
  },
};

export default plugin;
