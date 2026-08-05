import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool } from "@/hooks/useSchool";
import { Search, GraduationCap, BookOpen, Briefcase, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "student" | "class" | "staff";
  label: string;
  sub: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: school } = useCurrentSchool();

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ["global-search", school?.id, q],
    enabled: !!school?.id && q.trim().length >= 2,
    staleTime: 10 * 1000,
    queryFn: async () => {
      const sid = school!.id;
      const term = `%${q.trim()}%`;
      const [studentsRes, classesRes, staffRes] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name, matricule")
          .eq("school_id", sid).or(`first_name.ilike.${term},last_name.ilike.${term},matricule.ilike.${term}`).limit(5),
        supabase.from("classes").select("id, name").eq("school_id", sid).ilike("name", term).limit(4),
        supabase.from("profiles").select("id, full_name, phone").eq("school_id", sid).ilike("full_name", term).limit(4),
      ]);

      const out: SearchResult[] = [];
      (studentsRes.data ?? []).forEach((s) => {
        out.push({ id: s.id, type: "student", label: `${s.first_name} ${s.last_name}`, sub: `Matricule ${s.matricule}`, href: `/app/students/${s.id}` });
      });
      (classesRes.data ?? []).forEach((c: any) => {
        out.push({ id: c.id, type: "class", label: c.name, sub: "Classe", href: `/app/classes` });
      });
      (staffRes.data ?? []).forEach((p: any) => {
        out.push({ id: p.id, type: "staff", label: p.full_name ?? "—", sub: "Personnel", href: `/app/staff` });
      });
      return out;
    },
  });

  const handleSelect = (r: SearchResult) => {
    navigate(r.href);
    setOpen(false);
    setQ("");
  };

  const typeIcon = (type: SearchResult["type"]) => {
    if (type === "student") return GraduationCap;
    if (type === "class") return BookOpen;
    return Briefcase;
  };

  const typeColor = (type: SearchResult["type"]) => {
    if (type === "student") return "bg-primary/10 text-primary";
    if (type === "class") return "bg-info/10 text-info";
    return "bg-accent/10 text-accent";
  };

  return (
    <>
      {/* Trigger */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher… (⌘K)"
          readOnly
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-smooth cursor-pointer"
        />
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              {isLoading ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /> : <Search className="h-4 w-4 text-muted-foreground" />}
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un élève, une classe, du personnel…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground font-mono">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {q.length < 2 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Tapez au moins 2 caractères pour rechercher
                </div>
              ) : !results || results.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {isLoading ? "Recherche en cours…" : "Aucun résultat trouvé"}
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((r) => {
                    const Icon = typeIcon(r.type);
                    const color = typeColor(r.type);
                    return (
                      <li key={r.id}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-smooth text-left"
                          onClick={() => handleSelect(r)}
                        >
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.sub}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 px-4 py-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><kbd className="font-mono border border-border rounded px-1">↵</kbd> Sélectionner</span>
              <span className="flex items-center gap-1"><kbd className="font-mono border border-border rounded px-1">Esc</kbd> Fermer</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
