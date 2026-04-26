import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adjustLightness } from "@/lib/color";

type ThemeMode = "light" | "dark" | "system";

interface Palette {
  primary: string; // HSL string "215 80% 45%"
  accent: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  palette: Palette;
  schoolPalette: Palette | null;
  useSchoolPalette: boolean;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: Partial<Palette>) => void;
  setUseSchoolPalette: (use: boolean) => void;
  resetToSchoolPalette: () => void;
}

const DEFAULT_PALETTE: Palette = {
  primary: "215 80% 45%",
  accent: "160 70% 40%",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyPalette(palette: Palette) {
  const root = document.documentElement;
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--ring", palette.primary);
  root.style.setProperty("--primary-glow", adjustLightness(palette.primary, 15));
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--sidebar-primary", palette.primary);
  root.style.setProperty("--sidebar-ring", palette.primary);
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyMode(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("edu-theme-mode") as ThemeMode | null;
    return stored ?? "system";
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() => resolveMode(mode));

  const [palette, setPaletteState] = useState<Palette>(() => {
    const stored = localStorage.getItem("edu-palette");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PALETTE;
  });

  const [schoolPalette, setSchoolPalette] = useState<Palette | null>(null);
  const [useSchoolPalette, setUseSchoolPaletteState] = useState<boolean>(() => {
    const stored = localStorage.getItem("edu-use-school-palette");
    return stored === null ? true : stored === "true";
  });

  // Apply mode + listen system changes
  useEffect(() => {
    const resolved = resolveMode(mode);
    setResolvedMode(resolved);
    applyMode(resolved);
    localStorage.setItem("edu-theme-mode", mode);

    if (mode === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const next = mql.matches ? "dark" : "light";
        setResolvedMode(next);
        applyMode(next);
      };
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, [mode]);

  // Apply palette
  useEffect(() => {
    const active = useSchoolPalette && schoolPalette ? schoolPalette : palette;
    applyPalette(active);
  }, [palette, schoolPalette, useSchoolPalette]);

  // Load preferences + school palette on auth change
  useEffect(() => {
    const loadFromDb = async (userId: string) => {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme_mode, custom_primary_color, custom_accent_color, use_school_palette")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs) {
        setModeState((prefs.theme_mode as ThemeMode) ?? "system");
        setUseSchoolPaletteState(prefs.use_school_palette ?? true);
        if (prefs.custom_primary_color || prefs.custom_accent_color) {
          setPaletteState({
            primary: prefs.custom_primary_color ?? DEFAULT_PALETTE.primary,
            accent: prefs.custom_accent_color ?? DEFAULT_PALETTE.accent,
          });
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.school_id) {
        const { data: school } = await supabase
          .from("schools")
          .select("primary_color, accent_color")
          .eq("id", profile.school_id)
          .maybeSingle();

        if (school) {
          setSchoolPalette({
            primary: school.primary_color,
            accent: school.accent_color,
          });
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer to avoid blocking auth callback
        setTimeout(() => loadFromDb(session.user.id), 0);
      } else {
        setSchoolPalette(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadFromDb(session.user.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("user_preferences")
          .update({ theme_mode: newMode })
          .eq("user_id", user.id)
          .then(() => {});
      }
    });
  }, []);

  const setPalette = useCallback((next: Partial<Palette>) => {
    setPaletteState((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem("edu-palette", JSON.stringify(merged));
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("user_preferences")
            .update({
              custom_primary_color: merged.primary,
              custom_accent_color: merged.accent,
              use_school_palette: false,
            })
            .eq("user_id", user.id)
            .then(() => {});
        }
      });
      return merged;
    });
    setUseSchoolPaletteState(false);
    localStorage.setItem("edu-use-school-palette", "false");
  }, []);

  const setUseSchoolPalette = useCallback((use: boolean) => {
    setUseSchoolPaletteState(use);
    localStorage.setItem("edu-use-school-palette", String(use));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("user_preferences")
          .update({ use_school_palette: use })
          .eq("user_id", user.id)
          .then(() => {});
      }
    });
  }, []);

  const resetToSchoolPalette = useCallback(() => {
    setUseSchoolPalette(true);
  }, [setUseSchoolPalette]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        palette,
        schoolPalette,
        useSchoolPalette,
        setMode,
        setPalette,
        setUseSchoolPalette,
        resetToSchoolPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
