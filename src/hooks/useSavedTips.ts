import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchSavedTipIds, fetchTipsByIds, TipCard } from '../lib/tipLibrary';

// Standalone "Saved" list — used by the library page's Saved section and
// could be reused elsewhere (e.g. a profile tab) without pulling in the
// full filter/search machinery of useTipLibrary.
export function useSavedTips() {
  const [tips, setTips] = useState<TipCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSignedIn(false);
      setTips([]);
      setIsLoading(false);
      return;
    }

    setIsSignedIn(true);

    try {
      const ids = await fetchSavedTipIds(user.id);
      const items = await fetchTipsByIds(ids);
      setTips(items);
    } catch (err) {
      console.warn('Could not load saved tips:', err);
      setTips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tips, isLoading, isSignedIn, refresh: load };
}
