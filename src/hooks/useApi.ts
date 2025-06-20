import { useState, useEffect } from 'react';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API call failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

export function useAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: T): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await action(...args);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Action failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}