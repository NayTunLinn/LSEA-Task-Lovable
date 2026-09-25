import { useCallback, useEffect, useState } from "react";

const VIEWER_KEY = "lsea-viewer-v1";
const PROJECT_KEY = "lsea-project-v1";

let viewerId: string | null = null;
let projectId: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  viewerId = localStorage.getItem(VIEWER_KEY);
  projectId = sessionStorage.getItem(PROJECT_KEY);
}

function emit() {
  for (const l of listeners) l();
}

export function setViewer(id: string | null) {
  viewerId = id;
  if (typeof window !== "undefined") {
    if (id) localStorage.setItem(VIEWER_KEY, id);
    else localStorage.removeItem(VIEWER_KEY);
  }
  emit();
}

export function setActiveProject(id: string | null) {
  projectId = id;
  if (typeof window !== "undefined") {
    if (id) sessionStorage.setItem(PROJECT_KEY, id);
    else sessionStorage.removeItem(PROJECT_KEY);
  }
  emit();
}

export function useViewer() {
  const [, force] = useState(0);

  useEffect(() => {
    load();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    viewerId,
    projectId,
    setViewer: useCallback((id: string | null) => setViewer(id), []),
    setActiveProject: useCallback((id: string | null) => setActiveProject(id), []),
  };
}
