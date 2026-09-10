import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
const PreferencesContext = createContext(null);
export const PreferencesProvider = ({ children }) => {
  const [vegOnly, setVegOnly] = useLocalStorage("foodie-veg-only", false);
  const value = useMemo(
    () => ({
      vegOnly: vegOnly === true,
      toggleVegOnly: () => setVegOnly((previous) => !previous),
    }),
    [vegOnly, setVegOnly],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
export const usePreferences = () => {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences requires PreferencesProvider");
  return value;
};
