import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MODULES,
  MODULE_CHIP,
  PRIORITY_CLASS,
  STATUS_META,
  STATUS_ORDER,
  type Module,
  type Priority,
  type Status,
} from "@/lib/tasks";
import { formatWhen, useTasks, type ChecklistItem } from "@/lib/task-store";
import { useDirectory } from "@/lib/directory-store";

import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Task detail — Task Board" },
      {
        name: "description",
        content: "Full task detail: notes, acceptance checklist, status and activity history.",
      },
      { property: "og:title", content: "Task detail — Task Board" },
      {
        property: "og:description",
        content: "Notes, acceptance checklist, status controls and activity history for one task.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { tasks, hydrated, updateTask } = useTasks();
  const { people, roles, departments, projects } = useDirectory();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const assignedPerson = people.find((p) => p.id === task?.assigneeId);


  const [newItem, setNewItem] = useState("");

  if (!hydrated) {
    return <div className="bg-canvas min-h-screen" />;
  }

  if (!task) {
    return (
      <div className="bg-canvas font-display text-ink grid min-h-screen place-items-center px-5">
        <div className="text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink/40 uppercase">404</p>
          <h1 className="mt-2 text-[19px] font-semibold tracking-tight">Task not found</h1>
          <Link to="/" className="text-brand mt-3 inline-block text-[12px] font-medium hover:underline">
            ← Back to board
          </Link>
        </div>
      </div>
    );
  }

  const checklist: ChecklistItem[] = task.checklist ?? [];
  const doneCount = checklist.filter((c) => c.done).length;

  const setChecklist = (next: ChecklistItem[], log?: string) => updateTask(task.id, { checklist: next }, log);

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    setChecklist([...checklist, { id: `c${Date.now()}`, text, done: false }], `Added checklist item “${text}”`);
    setNewItem("");
  };

  return (
    <div className="bg-canvas font-display text-ink min-h-screen antialiased">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-5">
          <Link to="/" className="text-ink/55 hover:text-ink flex items-center gap-1.5 text-[12px] font-medium">
            <span className="text-sm leading-none">←</span> Board
          </Link>
          <span className="text-ink/20">/</span>
          <span className="text-brand/70 font-mono text-[11px]">{task.code}</span>
          <span className={`chip ml-auto ${STATUS_META[task.status].chip}`}>
            <span className={`size-1.5 rounded-full ${STATUS_META[task.status].dot}`} />
            {STATUS_META[task.status].label}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="bg-sheen mx-auto max-w-[1100px] px-5 py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <main className="min-w-0 space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`chip ${MODULE_CHIP[task.module]}`}>{task.module}</span>
                <span className={`pri ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
                <span className="font-mono text-[10px] text-ink/40">updated {task.updated}</span>
              </div>
              <input
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                className="focus:ring-brand/25 w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-[22px] leading-tight font-semibold tracking-tight outline-none hover:border-border focus:border-border focus:bg-card focus:ring-2"
              />
            </div>

            <section className="rounded-xl border border-border bg-card/80 p-4">
              <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-ink/40 uppercase">Description</div>
              <textarea
                value={task.detail}
                onChange={(e) => updateTask(task.id, { detail: e.target.value })}
                rows={4}
                className="focus:ring-brand/25 w-full resize-y rounded-lg border border-border bg-muted px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:ring-2"
              />
            </section>

            <section className="rounded-xl border border-border bg-card/80 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-mono text-[9px] tracking-[0.18em] text-ink/40 uppercase">Acceptance checklist</div>
                <span className="font-mono text-[10px] text-ink/40">
                  {doneCount}/{checklist.length}
                </span>
              </div>

              {checklist.length > 0 && (
                <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="from-brand-light to-brand h-full rounded-full bg-gradient-to-r transition-[width]"
                    style={{ width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%` }}
                  />
                </div>
              )}

              <div className="space-y-1">
                {checklist.map((c) => (
                  <div key={c.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() =>
                        setChecklist(
                          checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                          `${c.done ? "Unchecked" : "Checked"} “${c.text}”`,
                        )
                      }
                      className="accent-brand size-3.5"
                    />
                    <span className={`flex-1 text-[12.5px] ${c.done ? "text-ink/40 line-through" : ""}`}>{c.text}</span>
                    <button
                      onClick={() => setChecklist(checklist.filter((x) => x.id !== c.id), `Removed “${c.text}”`)}
                      className="text-ink/30 hover:text-rose-600 opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <p className="px-1.5 py-1 font-mono text-[11px] text-ink/40">No checklist items yet.</p>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add acceptance criterion…"
                   className="focus:ring-brand/25 h-8 flex-1 rounded-lg border border-border bg-muted px-2.5 text-[12px] outline-none focus:ring-2"
                />
                <button
                  onClick={addItem}
                  className="from-brand-light to-brand h-8 rounded-lg bg-gradient-to-b px-3 text-[11px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.5)]"
                >
                  Add
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card/80 p-4">
              <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-ink/40 uppercase">Notes</div>
              <textarea
                value={task.notes ?? ""}
                onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                rows={3}
                placeholder="Implementation notes, dependencies, open questions…"
                 className="focus:ring-brand/25 w-full resize-y rounded-lg border border-border bg-muted px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:ring-2"
              />
            </section>

            <section className="rounded-xl border border-border bg-card/80 p-4">
              <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-ink/40 uppercase">Activity</div>
              <ol className="space-y-2">
                {(task.activity ?? []).map((a) => (
                  <li key={a.id} className="flex gap-2.5 text-[12px]">
                    <span className="bg-brand/50 mt-1.5 size-1.5 shrink-0 rounded-full" />
                    <span className="flex-1 text-ink/70">{a.text}</span>
                    <span className="font-mono text-[10px] whitespace-nowrap text-ink/35">{formatWhen(a.at)}</span>
                  </li>
                ))}
                {(task.activity ?? []).length === 0 && (
                  <li className="font-mono text-[11px] text-ink/40">No activity recorded yet.</li>
                )}
              </ol>
            </section>
          </main>

          <aside className="space-y-3 rounded-xl border border-border bg-card/70 p-3.5 backdrop-blur-sm lg:sticky lg:top-[4.5rem]">
            <Field label="Status">
              <select
                value={task.status}
                onChange={(e) =>
                  updateTask(
                    task.id,
                    { status: e.target.value as Status },
                    `Status → ${STATUS_META[e.target.value as Status].label}`,
                  )
                }
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] font-medium"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Module">
              <select
                value={task.module}
                onChange={(e) => updateTask(task.id, { module: e.target.value as Module }, `Module → ${e.target.value}`)}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] font-medium"
              >
                {MODULES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={task.priority}
                onChange={(e) =>
                  updateTask(task.id, { priority: e.target.value as Priority }, `Priority → ${e.target.value}`)
                }
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] font-medium"
              >
                <option>P1</option>
                <option>P2</option>
                <option>P3</option>
              </select>
            </Field>

            <Field label="Assignee">
              <select
                value={task.assigneeId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const p = people.find((x) => x.id === id);
                  updateTask(
                    task.id,
                    { assigneeId: id, assignee: p?.name ?? "Unassigned" },
                    `Assigned to ${p?.name ?? "Unassigned"}`,
                  );
                }}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] font-medium"
              >
                <option value="">Unassigned</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {assignedPerson && (
                <p className="mt-1 font-mono text-[10px] text-ink/40">
                  {roles.find((r) => r.id === assignedPerson.roleId)?.name ?? "No role"} ·{" "}
                  {departments.find((d) => d.id === assignedPerson.departmentId)?.name ?? "No department"}
                </p>
              )}
            </Field>

            <Field label="Project">
              <select
                value={task.projectId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const pr = projects.find((x) => x.id === id);
                  updateTask(task.id, { projectId: id }, `Project → ${pr?.name ?? "None"}`);
                }}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] font-medium"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[9px] tracking-[0.18em] text-ink/40 uppercase">{label}</div>
      {children}
    </div>
  );
}
