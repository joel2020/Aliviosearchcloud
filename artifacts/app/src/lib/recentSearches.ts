import { useCallback, useEffect, useState } from "react";

const KEY = "alivio:recent-searches";
const MAX = 8;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

function write(values: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(values.slice(0, MAX)));
  } catch {
    // ignore quota / privacy mode failures
  }
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRecents(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const record = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecents((prev) => {
      const next = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecents([]);
    write([]);
  }, []);

  return { recents, record, clear };
}
