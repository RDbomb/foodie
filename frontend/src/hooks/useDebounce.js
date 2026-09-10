import { useState, useEffect } from "react";

/**
 * useDebounce — delays updating the returned value until `delay` ms
 * have passed without the input changing. Used to avoid re-filtering
 * the menu on every keystroke of the search box.
 *
 * @param {any} value - the fast-changing value (e.g. search input)
 * @param {number} delay - debounce delay in ms
 * @returns {any} the debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // cleanup: cancels the pending timeout if `value` changes again
    // before `delay` has elapsed (i.e. the user kept typing)
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
