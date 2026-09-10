import { useState, useEffect } from "react";
import axios from "axios";
export const useFetch = (url, fallbackData = null) => {
  const [data, setData] = useState(fallbackData),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    axios
      .get(url, { signal: controller.signal, timeout: 10000 })
      .then((res) => {
        if (!controller.signal.aborted) setData(res.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || "Request failed");
          setData(fallbackData);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, fallbackData]);
  return { data, loading, error };
};
