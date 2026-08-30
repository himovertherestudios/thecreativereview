import { useTipLibrary } from './useTipLibrary';

// Thin, purpose-named wrapper around useTipLibrary for standalone search
// (result count / loading / empty state). The library page itself uses
// useTipLibrary directly since search there needs to combine with subject
// and difficulty filters.
export function useTipSearch(query: string, subjectIdBySlug: Record<string, string>) {
  const { items, total, isLoading, error } = useTipLibrary({
    search: query,
    subjectIdBySlug,
    sort: 'recommended',
    pageSize: 24,
  });

  return { results: items, total, isLoading, error };
}
