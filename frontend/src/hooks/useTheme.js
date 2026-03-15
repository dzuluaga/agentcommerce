import { useCallback, useEffect, useState } from "react";

export default function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("agentcommerce-theme");
    if (saved) return saved === "dark";
    return false; // default to light
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("agentcommerce-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return { dark, toggle };
}
