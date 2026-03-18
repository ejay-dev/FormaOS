export interface ScimFilterNode {
  attribute: string;
  operator: 'eq' | 'ne' | 'co' | 'sw' | 'ew' | 'gt' | 'lt' | 'ge' | 'le' | 'pr';
  value?: string;
}

function resolveAttributeValue(record: Record<string, unknown>, attribute: string): unknown {
  const normalized = attribute.toLowerCase();
  const direct = record[attribute];
  if (typeof direct !== 'undefined') {
    return direct;
  }

  switch (normalized) {
    case 'username':
      return record.userName;
    case 'displayname':
      return record.displayName;
    case 'active':
      return record.active;
    case 'emails.value':
      return Array.isArray(record.emails)
        ? (record.emails as Array<{ value?: string }>).map((entry) => entry.value).join(' ')
        : undefined;
    case 'name.givenname':
      return (record.name as Record<string, unknown> | undefined)?.givenName;
    case 'name.familyname':
      return (record.name as Record<string, unknown> | undefined)?.familyName;
    case 'meta.lastmodified':
      return (record.meta as Record<string, unknown> | undefined)?.lastModified;
    default:
      return undefined;
  }
}

function compareValues(left: unknown, right: string | undefined, operator: ScimFilterNode['operator']) {
  const normalizedLeft =
    typeof left === 'string' ? left.toLowerCase() : left instanceof Date ? left.toISOString() : left;
  const normalizedRight = right?.toLowerCase();

  if (operator === 'pr') {
    if (Array.isArray(left)) return left.length > 0;
    return left !== null && typeof left !== 'undefined' && String(left).length > 0;
  }

  if (typeof normalizedLeft === 'boolean') {
    const booleanRight = normalizedRight === 'true';
    if (operator === 'eq') return normalizedLeft === booleanRight;
    if (operator === 'ne') return normalizedLeft !== booleanRight;
    return false;
  }

  if (typeof normalizedLeft === 'number') {
    const numberRight = Number(normalizedRight);
    if (Number.isNaN(numberRight)) return false;
    switch (operator) {
      case 'eq':
        return normalizedLeft === numberRight;
      case 'ne':
        return normalizedLeft !== numberRight;
      case 'gt':
        return normalizedLeft > numberRight;
      case 'lt':
        return normalizedLeft < numberRight;
      case 'ge':
        return normalizedLeft >= numberRight;
      case 'le':
        return normalizedLeft <= numberRight;
      default:
        return false;
    }
  }

  const leftString = String(normalizedLeft ?? '');
  const rightString = String(normalizedRight ?? '');

  switch (operator) {
    case 'eq':
      return leftString === rightString;
    case 'ne':
      return leftString !== rightString;
    case 'co':
      return leftString.includes(rightString);
    case 'sw':
      return leftString.startsWith(rightString);
    case 'ew':
      return leftString.endsWith(rightString);
    case 'gt':
      return leftString > rightString;
    case 'lt':
      return leftString < rightString;
    case 'ge':
      return leftString >= rightString;
    case 'le':
      return leftString <= rightString;
    default:
      return false;
  }
}

export function parseScimFilterExpression(filter?: string | null): ScimFilterNode[] {
  if (!filter?.trim()) return [];

  return filter
    .split(/\s+and\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause) => {
      const presenceMatch = clause.match(/^([A-Za-z0-9_.:$-]+)\s+pr$/i);
      if (presenceMatch) {
        return {
          attribute: presenceMatch[1],
          operator: 'pr' as const,
        };
      }

      const match = clause.match(
        /^([A-Za-z0-9_.:$-]+)\s+(eq|ne|co|sw|ew|gt|lt|ge|le)\s+"?([^"]+?)"?$/i,
      );

      if (!match) {
        throw new Error(`Unsupported SCIM filter clause: ${clause}`);
      }

      return {
        attribute: match[1],
        operator: match[2].toLowerCase() as ScimFilterNode['operator'],
        value: match[3],
      };
    });
}

export function applyScimFilter<T extends object>(
  records: T[],
  filter?: string | null,
): T[] {
  const nodes = parseScimFilterExpression(filter);
  if (!nodes.length) return records;

  return records.filter((record) =>
    nodes.every((node) => {
      const value = resolveAttributeValue(record as Record<string, unknown>, node.attribute);
      return compareValues(value, node.value, node.operator);
    }),
  );
}

export function applyScimSort<T extends object>(
  records: T[],
  sortBy?: string | null,
  sortOrder?: string | null,
) {
  if (!sortBy) return records;
  const direction = sortOrder?.toLowerCase() === 'descending' ? -1 : 1;

  return [...records].sort((left, right) => {
    const leftValue = resolveAttributeValue(left as Record<string, unknown>, sortBy);
    const rightValue = resolveAttributeValue(right as Record<string, unknown>, sortBy);
    return String(leftValue ?? '').localeCompare(String(rightValue ?? '')) * direction;
  });
}
