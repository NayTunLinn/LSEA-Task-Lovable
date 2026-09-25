import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Module, Priority, Status, Task } from "@/lib/tasks";

export type ChecklistItem = { id: string; text: string; done: boolean };
export type ActivityEntry = { id: string; at: string; text: string };

export type TaskDetailed = Task & {
  notes?: string | undefined;
  checklist?: ChecklistItem[] | undefined;
  activity?: ActivityEntry[] | undefined;
  sortOrder?: number | undefined;
  projectId?: string | null | undefined;
  assigneeId?: string | null | undefined;
};

type Row = {
  id: string;
  code: string;
  title: string;
  detail: string;
  module: string;
  status: string;
  priority: string;
  updated: string;
  assignee: string;
  notes: string | null;
  checklist: unknown;
  activity: unknown;
  sort_order: number;
  project_id: string | null;
  assignee_id: string | null;
};

let state: TaskDetailed[] = [];
let started = false;
let ready = false;
const listeners = new Set<(t: TaskDetailed[], ready: boolean) => void>();

function emit() {
  for (const l of listeners) l(state, ready);
}

function fromRow(r: Row): TaskDetailed {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    detail: r.detail,
    module: r.module as Module,
    status: r.status as Status,
    priority: r.priority as Priority,
    updated: r.updated,
    assignee: r.assignee,
    notes: r.notes ?? "",
    checklist: (r.checklist as ChecklistItem[]) ?? [],
    activity: (r.activity as ActivityEntry[]) ?? [],
    sortOrder: r.sort_order,
    projectId: r.project_id,
    assigneeId: r.assignee_id,
  };
}

function sortTasks(list: TaskDetailed[]) {
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

async function fetchAll() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data) state = (data as unknown as Row[]).map(fromRow);
  ready = true;
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchAll();

  supabase
    .channel("tasks-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const old = payload.old as { id?: string };
        state = state.filter((t) => t.id !== old.id);
      } else {
        const row = fromRow(payload.new as Row);
        state = state.some((t) => t.id === row.id)
          ? state.map((t) => (t.id === row.id ? row : t))
          : [...state, row];
        state = sortTasks(state);
      }
      emit();
    })
    .subscribe();
}

function applyLocal(next: TaskDetailed[]) {
  state = sortTasks(next);
  emit();
}

export async function updateTask(id: string, patch: Partial<TaskDetailed>, log?: string) {
  const current = state.find((t) => t.id === id);
  if (!current) return;

  const activity = log
    ? [
        { id: `a${Date.now()}`, at: new Date().toISOString(), text: log },
        ...(current.activity ?? []),
      ].slice(0, 40)
    : (current.activity ?? []);

  const merged: TaskDetailed = { ...current, ...patch, updated: "now", activity };
  applyLocal(state.map((t) => (t.id === id ? merged : t)));

  await supabase
    .from("tasks")
    .update({
      title: merged.title,
      detail: merged.detail,
      module: merged.module,
      status: merged.status,
      priority: merged.priority,
      assignee: merged.assignee,
      notes: merged.notes ?? "",
      checklist: merged.checklist ?? [],
      activity: merged.activity ?? [],
      project_id: merged.projectId ?? null,
      assignee_id: merged.assigneeId ?? null,
      updated: "now",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function addTask(task: Omit<TaskDetailed, "sortOrder">) {
  const minOrder = state.reduce((m, t) => Math.min(m, t.sortOrder ?? 0), 0);
  const sortOrder = minOrder - 1;
  const next: TaskDetailed = { ...task, sortOrder };
  applyLocal([...state, next]);

  await supabase.from("tasks").insert({
    id: next.id,
    code: next.code,
    title: next.title,
    detail: next.detail,
    module: next.module,
    status: next.status,
    priority: next.priority,
    updated: next.updated,
    assignee: next.assignee,
    notes: next.notes ?? "",
    checklist: next.checklist ?? [],
    activity: next.activity ?? [],
    sort_order: sortOrder,
    project_id: next.projectId ?? null,
    assignee_id: next.assigneeId ?? null,
  });
}

export function useTasks() {
  const [tasks, setLocal] = useState<TaskDetailed[]>(state);
  const [hydrated, setHydrated] = useState(ready);

  useEffect(() => {
    start();
    setLocal(state);
    setHydrated(ready);
    const l = (t: TaskDetailed[], r: boolean) => {
      setLocal(t);
      setHydrated(r);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const add = useCallback((task: Omit<TaskDetailed, "sortOrder">) => addTask(task), []);

  return { tasks, hydrated, addTask: add, updateTask };
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportTasksMarkdown(
  tasks: TaskDetailed[],
  project?: { code: string; name: string } | null,
) {
  const date = new Date().toISOString().slice(0, 10);
  const label = project ? `${project.code} · ${project.name}` : "Task Board";
  const lines = [
    `# ${label} Tasks — ${date}`,
    "",
    `Project: ${label}`,
    `Total: ${tasks.length} tasks`,
    "",
    ...tasks.map((t) => {
      const meta = [t.code, t.module, t.status, t.priority, t.assignee].join(" · ");
      return [`## ${t.title}`, `*${meta}*`, "", t.detail || "_No detail_", ""].join("\n");
    }),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(project?.code ?? "tasks").toLowerCase()}-${date}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
