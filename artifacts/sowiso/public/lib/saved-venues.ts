import { useCallback, useEffect, useState } from "react";
import type { Venue } from "@/components/VenueCard";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface SavedVenue extends Venue {
  savedAt: string;
}

/**
 * Lightweight in-process pub/sub so multiple mounted hooks (e.g. the
 * region's "The Local" panel and the Profile "My Venues" tab) stay in
 * sync after a save / unsave without a full refetch.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((l) => l()); }

/**
 * Hook that loads the caller's saved venue IDs and exposes a toggle helper.
 * Used by VenueCard hosts (CompassRegion, Profile) so a single bookmark
 * click optimistically updates the UI and persists via the API.
 *
 * The hook is a no-op for unauthenticated callers (returns `enabled: false`).
 */
export function useSavedVenues(enabled: boolean) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedVenues, setSavedVenues] = useState<SavedVenue[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSavedIds(new Set());
      setSavedVenues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/venues/saved`, { credentials: "include" });
      if (!res.ok) {
        setSavedIds(new Set());
        setSavedVenues([]);
        return;
      }
      const data = await res.json() as { venues: SavedVenue[] };
      const list = data.venues ?? [];
      setSavedVenues(list);
      setSavedIds(new Set(list.map((v) => v.id)));
    } catch {
      setSavedIds(new Set());
      setSavedVenues([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Subscribe to cross-component sync events.
  useEffect(() => {
    if (!enabled) return;
    const listener: Listener = () => { void refresh(); };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, [enabled, refresh]);

  const toggleSave = useCallback(async (venue: Venue) => {
    if (!enabled) return;
    const wasSaved = savedIds.has(venue.id);
    setPendingId(venue.id);

    // Optimistic update so the bookmark icon flips immediately.
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(venue.id); else next.add(venue.id);
      return next;
    });

    try {
      const res = wasSaved
        ? await fetch(`${API_BASE}/api/venues/saved/${encodeURIComponent(venue.id)}`, {
            method: "DELETE",
            credentials: "include",
          })
        : await fetch(`${API_BASE}/api/venues/saved`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ venue_id: venue.id }),
          });

      if (!res.ok) {
        // Roll back on failure.
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(venue.id); else next.delete(venue.id);
          return next;
        });
        return;
      }

      // Update the materialised list locally so the Profile tab reflects
      // the change without waiting for a network round-trip.
      if (wasSaved) {
        setSavedVenues((prev) => prev.filter((v) => v.id !== venue.id));
      } else {
        const fresh: SavedVenue = { ...venue, savedAt: new Date().toISOString() };
        setSavedVenues((prev) => [fresh, ...prev.filter((v) => v.id !== venue.id)]);
      }
      notify();
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(venue.id); else next.delete(venue.id);
        return next;
      });
    } finally {
      setPendingId(null);
    }
  }, [enabled, savedIds]);

  return { savedIds, savedVenues, loading, pendingId, toggleSave, refresh };
}
