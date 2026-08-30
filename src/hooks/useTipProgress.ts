import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchTipProgress,
  recordTipView,
  setTipCompleted,
  setTipSaved,
  TipProgress,
} from '../lib/tipLibrary';

export function useTipProgress(tipId: string | undefined) {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<TipProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tipId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        setUserId(null);
        setProgress(null);
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      try {
        const existing = await fetchTipProgress(user.id, tipId);
        if (isMounted) setProgress(existing);

        // Record the view (upsert), then reflect it locally without a
        // second round-trip.
        await recordTipView(user.id, tipId);
        if (isMounted) {
          setProgress((current) => ({
            id: current?.id || '',
            tipId,
            saved: current?.saved ?? false,
            completedAt: current?.completedAt ?? null,
            viewedAt: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Could not load tip progress:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [tipId]);

  const toggleSaved = useCallback(async () => {
    if (!userId || !tipId) return;

    const nextSaved = !(progress?.saved ?? false);

    setProgress((current) => ({
      id: current?.id || '',
      tipId,
      saved: nextSaved,
      completedAt: current?.completedAt ?? null,
      viewedAt: current?.viewedAt ?? new Date().toISOString(),
    }));

    try {
      await setTipSaved(userId, tipId, nextSaved);
    } catch (err) {
      // Roll back on failure.
      setProgress((current) =>
        current ? { ...current, saved: !nextSaved } : current
      );
      console.warn('Could not save tip:', err);
    }
  }, [userId, tipId, progress?.saved]);

  const toggleCompleted = useCallback(async () => {
    if (!userId || !tipId) return;

    const nextCompleted = !progress?.completedAt;
    const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;

    setProgress((current) => ({
      id: current?.id || '',
      tipId,
      saved: current?.saved ?? false,
      completedAt: nextCompletedAt,
      viewedAt: current?.viewedAt ?? new Date().toISOString(),
    }));

    try {
      await setTipCompleted(userId, tipId, nextCompleted);
    } catch (err) {
      setProgress((current) =>
        current ? { ...current, completedAt: progress?.completedAt ?? null } : current
      );
      console.warn('Could not update tip completion:', err);
    }
  }, [userId, tipId, progress?.completedAt]);

  return {
    isSignedIn: Boolean(userId),
    isLoading,
    saved: progress?.saved ?? false,
    completed: Boolean(progress?.completedAt),
    toggleSaved,
    toggleCompleted,
  };
}
