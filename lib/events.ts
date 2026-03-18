// A simple custom event system to bypass complex React Contexts
export const SEARCH_EVENT = "open-command-menu";

export function openSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SEARCH_EVENT));
  }
}