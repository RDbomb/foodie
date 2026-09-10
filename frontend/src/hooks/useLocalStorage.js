import { useState, useEffect } from "react";

/**
 * useLocalStorage — behaves like useState, but persists the value
 * in localStorage so it survives page refreshes.
 *
 * @param {string} key - localStorage key
 * @param {any} initialValue - default value if nothing is stored yet
 * @returns {[any, Function]} - [value, setValue], same shape as useState
 */
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage might be unavailable (private browsing, quota, etc.)
      // fail silently rather than crash the app
    }
  }, [key, value]);

  return [value, setValue];
};
