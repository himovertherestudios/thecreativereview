import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchSavedTipIds,
  fetchTips,
  fetchTipsByIds,
  TipCard,
  TipFilters,
} from '../lib/tipLibrary';

const SEARCH_DEBOUNCE_MS = 350;

type UseTipLibraryOptions = TipFilters & {
  subjectIdBySlug: Record<string, string>;
};

export function useTipLibrary(options: UseTipLibraryOptions) {
  const { subjectIdBySlug, ...filters } = options;

  const [items, setItems] = useState<TipCard[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    const run = async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError('');

      try {
        if (filters.view === 'saved') {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            if (requestId === requestIdRef.current) {
              setItems([]);
              setTotal(0);
              setIsLoading(false);
            }
            return;
          }

          const savedIds = await fetchSavedTipIds(user.id);
          const savedTips = await fetchTipsByIds(savedIds);

          const filtered = savedTips.filter((tip) => {
            if (filters.subjectSlug && !tip.subjects.some((s) => s.slug === filters.subjectSlug)) {
              return false;
            }
            if (filters.difficulty && tip.difficulty !== filters.difficulty) return false;
            if (
              filters.search &&
              !`${tip.title} ${tip.lessonPreview}`
                .toLowerCase()
                .includes(filters.search.toLowerCase())
            ) {
              return false;
            }
            return true;
          });

          if (requestId === requestIdRef.current) {
            setItems(filtered);
            setTotal(filtered.length);
            setIsLoading(false);
          }
          return;
        }

        const result = await fetchTips(filters, subjectIdBySlug);

        if (requestId === requestIdRef.current) {
          setItems(result.items);
          setTotal(result.total);
          setIsLoading(false);
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Could not load tips.');
          setItems([]);
          setTotal(0);
          setIsLoading(false);
        }
      }
    };

    // Debounce only matters for free-text search; other filter changes can
    // run immediately for a snappier feel.
    if (filters.search) {
      debounceRef.current = window.setTimeout(run, SEARCH_DEBOUNCE_MS);
    } else {
      run();
    }

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.view,
    filters.subjectSlug,
    filters.difficulty,
    filters.search,
    filters.sort,
    filters.page,
    filters.pageSize,
    subjectIdBySlug,
  ]);

  return { items, total, isLoading, error };
}
