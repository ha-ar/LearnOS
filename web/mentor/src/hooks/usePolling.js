import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(asyncFn, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await asyncFnRef.current();
      setData(res);
      setError(null);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Polling interval
  useEffect(() => {
    fetchData(false);

    const timer = setInterval(() => {
      fetchData(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, fetchData]);

  // Tick seconds ago count
  useEffect(() => {
    if (!lastUpdated) return;
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((new Date() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastUpdated]);

  return { data, loading, error, lastUpdated, secondsAgo, refresh: () => fetchData(false) };
}
