import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const THEME_KEY = "lsea-theme";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = preferredTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="size-9 shrink-0 border-border bg-card/70 shadow-none"
    >
      {mounted && theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}