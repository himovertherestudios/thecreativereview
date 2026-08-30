import { useCallback, useEffect, useState } from 'react';
import {
  fetchTipSubjectCounts,
  fetchTipSubjects,
  TipSubjectWithCount,
} from '../lib/tipLibrary';

// Module-level cache so subject counts (a full-table-ish scan of the join
// table) only run once per session, not once per page visit.
let subjectsCache: TipSubjectWithCount[] | null = null;
let subjectsCachePromise: Promise<TipSubjectWithCount[]> | null = null;

async function loadSubjectsWithCounts(): Promise<TipSubjectWithCount[]> {
  const [subjects, counts] = await Promise.all([
    fetchTipSubjects(),
    fetchTipSubjectCounts(),
  ]);

  return subjects.map((subject) => ({
    ...subject,
    count: counts[subject.id] || 0,
  }));
}

export function useTipSubjects() {
  const [subjects, setSubjects] = useState<TipSubjectWithCount[]>(subjectsCache || []);
  const [isLoading, setIsLoading] = useState(!subjectsCache);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subjectsCache) {
      setSubjects(subjectsCache);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    if (!subjectsCachePromise) {
      subjectsCachePromise = loadSubjectsWithCounts();
    }

    subjectsCachePromise
      .then((result) => {
        subjectsCache = result;
        if (isMounted) {
          setSubjects(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        subjectsCachePromise = null;
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not load subjects.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectIdBySlug = subjects.reduce<Record<string, string>>((acc, subject) => {
    acc[subject.slug] = subject.id;
    return acc;
  }, {});

  const refresh = useCallback(async () => {
    subjectsCache = null;
    subjectsCachePromise = null;
    setIsLoading(true);

    try {
      const result = await loadSubjectsWithCounts();
      subjectsCache = result;
      setSubjects(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subjects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { subjects, subjectIdBySlug, isLoading, error, refresh };
}
