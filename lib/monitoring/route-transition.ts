'use client';

const ROUTE_TRANSITION_KEY = 'formaos_route_transition_marker_v1';
const ROUTE_TRANSITION_TTL_MS = 120_000;

type RouteTransitionMarker = {
  fromRoute: string;
  toRoute: string;
  startedAtMs: number;
  navSource: 'sidebar';
};

export type RouteTransitionSample = {
  fromRoute: string;
  toRoute: string;
  durationMs: number;
  navSource: 'sidebar';
};

function readMarker(): RouteTransitionMarker | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ROUTE_TRANSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RouteTransitionMarker;
    if (
      typeof parsed.fromRoute !== 'string' ||
      typeof parsed.toRoute !== 'string' ||
      typeof parsed.startedAtMs !== 'number' ||
      parsed.navSource !== 'sidebar'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearMarker(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ROUTE_TRANSITION_KEY);
  } catch {
    // noop
  }
}

export function markSidebarRouteTransition(toRoute: string): void {
  if (typeof window === 'undefined') return;
  try {
    const fromRoute = window.location.pathname || '';
    const marker: RouteTransitionMarker = {
      fromRoute,
      toRoute,
      startedAtMs: Date.now(),
      navSource: 'sidebar',
    };
    window.sessionStorage.setItem(ROUTE_TRANSITION_KEY, JSON.stringify(marker));
  } catch {
    // noop
  }
}

export function consumeSidebarRouteTransition(
  currentRoute: string,
): RouteTransitionSample | null {
  const marker = readMarker();
  if (!marker) return null;

  const age = Date.now() - marker.startedAtMs;
  if (age < 0 || age > ROUTE_TRANSITION_TTL_MS) {
    clearMarker();
    return null;
  }

  if (marker.toRoute !== currentRoute) {
    return null;
  }

  clearMarker();

  if (marker.fromRoute === currentRoute) {
    return null;
  }

  return {
    fromRoute: marker.fromRoute,
    toRoute: marker.toRoute,
    durationMs: age,
    navSource: marker.navSource,
  };
}
