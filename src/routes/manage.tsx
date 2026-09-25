import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  addDepartment,
  addModule,
  addPerson,
  addProject,
  addRole,
  removeRow,
  updateDepartment,
  updateModule,
  updatePerson,
  updateProject,
  updateRole,
  useDirectory,
  type Person,
} from "@/lib/directory-store";
import {
  downloadDirectoryWorkbook,
  persistDirectoryImport,
  readDirectoryWorkbook,
  type DirectoryImport,
} from "@/lib/directory-excel";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "People & setup — Task Board" },
      {
        name: "description",
        content:
          "Manage people, roles, departments, projects and modules so tasks can be assigned to the right person.",
      },
      { property: "og:title", content: "People & setup — Task Board" },
      {
        property: "og:description",
        content: "Manage people, roles, departments, projects and modules for Task Board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Manage,
});

type Tab = "people" | "roles" | "departments" | "projects" | "modules";
const TABS: { id: Tab; label: string }[] = [
  { id: "people", label: "People" },
  { id: "roles", label: "Roles" },
  { id: "departments", label: "Departments" },
  { id: "projects", label: "Projects" },
  { id: "modules", label: "Modules" },
];

function Manage() {
  const dir = useDirectory();
  const [tab, setTab] = useState<Tab>("people");
  const excelInput = useRef<HTMLInputElement>(null);
  const [excelBusy, setExcelBusy] = useState(false);
  const [excelMessage, setExcelMessage] = useState("");

  const handleExcelImport = async (file: File) => {
    setExcelBusy(true);
    setExcelMessage("");
    try {
      const data: DirectoryImport = await readDirectoryWorkbook(file);
      const result = await persistDirectoryImport(data);
      await dir.refresh();
      setExcelMessage(
        `Imported ${result.people} people, ${result.projects} projects, ${result.modules} modules.`,
      );
    } catch (error) {
      setExcelMessage(error instanceof Error ? error.message : "Could not import the workbook.");
    } finally {
      setExcelBusy(false);
      if (excelInput.current) excelInput.current.value = "";
    }
  };

  const [person, setPerson] = useState({ name: "", email: "", roleId: "", departmentId: "" });
  const [simple, setSimple] = useState("");
  const [project, setProject] = useState({ name: "", code: "", description: "" });
  const [mod, setMod] = useState({ name: "", projectId: "" });

  // inline edit state (per table)
  const [editSimpleId, setEditSimpleId] = useState<string | null>(null);
  const [editSimpleName, setEditSimpleName] = useState("");
  const [editPersonId, setEditPersonId] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState({ name: "", email: "" });
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState({ name: "", code: "", description: "" });
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editModule, setEditModule] = useState({ name: "", projectId: "" });

  const switchTab = (t: Tab) => {
    setTab(t);
    setEditSimpleId(null);
    setEditPersonId(null);
    setEditProjectId(null);
    setEditModuleId(null);
  };

  return (
    <div className="bg-canvas font-display text-ink min-h-screen antialiased">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-5">
          <Link
            to="/"
            className="text-ink/55 hover:text-ink flex items-center gap-1.5 text-[12px] font-medium"
          >
            <span className="text-sm leading-none">←</span> Board
          </Link>
          <span className="text-ink/20">/</span>
          <span className="text-[13px] font-semibold tracking-tight">People &amp; setup</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="bg-sheen mx-auto max-w-[1100px] px-5 py-6">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold">Excel directory tools</p>
            <p className="font-mono text-[10px] text-ink/45">
              Template / တင်သွင်းရန် · Export / ဒေါင်းလုဒ်
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => void downloadDirectoryWorkbook(dir, true)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-[11px] font-medium text-ink/70 hover:bg-accent disabled:opacity-50"
            >
              Download template
            </button>
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => void downloadDirectoryWorkbook(dir)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-[11px] font-medium text-ink/70 hover:bg-accent disabled:opacity-50"
            >
              Export Excel
            </button>
            <input
              ref={excelInput}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleExcelImport(file);
              }}
            />
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => excelInput.current?.click()}
              className="from-brand-light to-brand min-h-11 rounded-lg bg-gradient-to-b px-3 text-[11px] font-medium text-white disabled:opacity-50"
            >
              {excelBusy ? "Importing…" : "Upload Excel"}
            </button>
          </div>
          {excelMessage && <p className="text-[11px] text-ink/60 sm:ml-auto">{excelMessage}</p>}
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`h-8 rounded-lg border px-3 text-[12px] font-medium transition ${
                tab === t.id
                  ? "border-brand/25 bg-brand/10 text-brand"
                  : "border-border bg-card/70 text-ink/60 hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "people" && (
          <Panel title="People" hint="Everyone who can be assigned a task.">
            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_9rem_auto]">
              <Input
                value={person.name}
                onChange={(v) => setPerson({ ...person, name: v })}
                placeholder="Full name"
              />
              <Input
                value={person.email}
                onChange={(v) => setPerson({ ...person, email: v })}
                placeholder="Email"
              />
              <Select value={person.roleId} onChange={(v) => setPerson({ ...person, roleId: v })}>
                <option value="">Role…</option>
                {dir.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
              <Select
                value={person.departmentId}
                onChange={(v) => setPerson({ ...person, departmentId: v })}
              >
                <option value="">Department…</option>
                {dir.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Primary
                onClick={() => {
                  if (!person.name.trim()) return;
                  void addPerson({
                    name: person.name.trim(),
                    email: person.email.trim(),
                    roleId: person.roleId || null,
                    departmentId: person.departmentId || null,
                  });
                  setPerson({ name: "", email: "", roleId: "", departmentId: "" });
                }}
              >
                Add person
              </Primary>
            </div>

            <div className="space-y-1.5">
              {dir.people.map((p) => (
                <div
                  key={p.id}
                  className="grid items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_9rem_auto]"
                >
                  {editPersonId === p.id ? (
                    <>
                      <Input
                        value={editPerson.name}
                        onChange={(v) => setEditPerson({ ...editPerson, name: v })}
                        placeholder="Full name"
                      />
                      <Input
                        value={editPerson.email}
                        onChange={(v) => setEditPerson({ ...editPerson, email: v })}
                        placeholder="Email"
                      />
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Save
                          onClick={() => {
                            if (!editPerson.name.trim()) return;
                            void updatePerson(p.id, {
                              name: editPerson.name.trim(),
                              email: editPerson.email.trim(),
                            });
                            setEditPersonId(null);
                          }}
                        />
                        <Cancel onClick={() => setEditPersonId(null)} />
                      </div>
                      <span />
                    </>
                  ) : (
                    <>
                      <span className="truncate text-[12.5px] font-medium">{p.name}</span>
                      <span className="truncate font-mono text-[11px] text-ink/45">
                        {p.email || "—"}
                      </span>
                      <Select
                        value={p.roleId ?? ""}
                        onChange={(v) => void updatePerson(p.id, { roleId: v || null })}
                      >
                        <option value="">No role</option>
                        {dir.roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={p.departmentId ?? ""}
                        onChange={(v) => void updatePerson(p.id, { departmentId: v || null })}
                      >
                        <option value="">No department</option>
                        {dir.departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </Select>
                      <div className="flex items-center gap-1">
                        <Edit
                          onClick={() => {
                            setEditPersonId(p.id);
                            setEditPerson({ name: p.name, email: p.email });
                          }}
                        />
                        <Remove onClick={() => void removeRow("people", p.id)} />
                      </div>
                    </>
                  )}
                </div>
              ))}
              {dir.people.length === 0 && <Empty>No people yet.</Empty>}
            </div>
          </Panel>
        )}

        {(tab === "roles" || tab === "departments") && (
          <Panel
            title={tab === "roles" ? "Roles" : "Departments"}
            hint={
              tab === "roles"
                ? "What a person does on the project."
                : "Which team a person belongs to."
            }
          >
            <div className="mb-3 flex gap-2">
              <Input
                value={simple}
                onChange={setSimple}
                placeholder={tab === "roles" ? "New role name" : "New department name"}
              />
              <Primary
                onClick={() => {
                  const v = simple.trim();
                  if (!v) return;
                  void (tab === "roles" ? addRole(v) : addDepartment(v));
                  setSimple("");
                }}
              >
                Add
              </Primary>
            </div>
            <div className="space-y-1.5">
              {(tab === "roles" ? dir.roles : dir.departments).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-2"
                >
                  {editSimpleId === r.id ? (
                    <>
                      <div className="flex-1">
                        <Input
                          value={editSimpleName}
                          onChange={setEditSimpleName}
                          placeholder="Name"
                        />
                      </div>
                      <Save
                        onClick={() => {
                          const v = editSimpleName.trim();
                          if (!v) return;
                          void (tab === "roles" ? updateRole(r.id, v) : updateDepartment(r.id, v));
                          setEditSimpleId(null);
                        }}
                      />
                      <Cancel onClick={() => setEditSimpleId(null)} />
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[12.5px]">{r.name}</span>
                      <Edit
                        onClick={() => {
                          setEditSimpleId(r.id);
                          setEditSimpleName(r.name);
                        }}
                      />
                      <Remove onClick={() => void removeRow(tab, r.id)} />
                    </>
                  )}
                </div>
              ))}
              {(tab === "roles" ? dir.roles : dir.departments).length === 0 && (
                <Empty>Nothing here yet.</Empty>
              )}
            </div>
          </Panel>
        )}

        {tab === "projects" && (
          <Panel title="Projects" hint="Group tasks under a project.">
            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto]">
              <Input
                value={project.name}
                onChange={(v) => setProject({ ...project, name: v })}
                placeholder="Project name"
              />
              <Input
                value={project.code}
                onChange={(v) => setProject({ ...project, code: v })}
                placeholder="Code"
              />
              <Input
                value={project.description}
                onChange={(v) => setProject({ ...project, description: v })}
                placeholder="Short description"
              />
              <Primary
                onClick={() => {
                  if (!project.name.trim() || !project.code.trim()) return;
                  void addProject(
                    project.name.trim(),
                    project.code.trim().toUpperCase(),
                    project.description.trim(),
                  );
                  setProject({ name: "", code: "", description: "" });
                }}
              >
                Add project
              </Primary>
            </div>
            <div className="space-y-1.5">
              {dir.projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-2"
                >
                  {editProjectId === p.id ? (
                    <>
                      <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]">
                        <Input
                          value={editProject.name}
                          onChange={(v) => setEditProject({ ...editProject, name: v })}
                          placeholder="Project name"
                        />
                        <Input
                          value={editProject.code}
                          onChange={(v) => setEditProject({ ...editProject, code: v })}
                          placeholder="Code"
                        />
                        <Input
                          value={editProject.description}
                          onChange={(v) => setEditProject({ ...editProject, description: v })}
                          placeholder="Short description"
                        />
                      </div>
                      <Save
                        onClick={() => {
                          if (!editProject.name.trim() || !editProject.code.trim()) return;
                          void updateProject(p.id, {
                            name: editProject.name.trim(),
                            code: editProject.code.trim().toUpperCase(),
                            description: editProject.description.trim(),
                          });
                          setEditProjectId(null);
                        }}
                      />
                      <Cancel onClick={() => setEditProjectId(null)} />
                    </>
                  ) : (
                    <>
                      <span className="text-brand/70 font-mono text-[10px]">{p.code}</span>
                      <span className="text-[12.5px] font-medium">{p.name}</span>
                      <span className="flex-1 truncate text-[11px] text-ink/45">
                        {p.description}
                      </span>
                      <Edit
                        onClick={() => {
                          setEditProjectId(p.id);
                          setEditProject({
                            name: p.name,
                            code: p.code,
                            description: p.description,
                          });
                        }}
                      />
                      <Remove onClick={() => void removeRow("projects", p.id)} />
                    </>
                  )}
                </div>
              ))}
              {dir.projects.length === 0 && <Empty>No projects yet.</Empty>}
            </div>
          </Panel>
        )}

        {tab === "modules" && (
          <Panel title="Modules" hint="Areas of the product a task belongs to.">
            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input
                value={mod.name}
                onChange={(v) => setMod({ ...mod, name: v })}
                placeholder="Module name"
              />
              <Select value={mod.projectId} onChange={(v) => setMod({ ...mod, projectId: v })}>
                <option value="">No project</option>
                {dir.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Primary
                onClick={() => {
                  if (!mod.name.trim()) return;
                  void addModule(mod.name.trim(), mod.projectId || null);
                  setMod({ name: "", projectId: "" });
                }}
              >
                Add module
              </Primary>
            </div>
            <div className="space-y-1.5">
              {dir.modules.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-2"
                >
                  {editModuleId === m.id ? (
                    <>
                      <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <Input
                          value={editModule.name}
                          onChange={(v) => setEditModule({ ...editModule, name: v })}
                          placeholder="Module name"
                        />
                        <Select
                          value={editModule.projectId}
                          onChange={(v) => setEditModule({ ...editModule, projectId: v })}
                        >
                          <option value="">No project</option>
                          {dir.projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Save
                        onClick={() => {
                          if (!editModule.name.trim()) return;
                          void updateModule(m.id, {
                            name: editModule.name.trim(),
                            projectId: editModule.projectId || null,
                          });
                          setEditModuleId(null);
                        }}
                      />
                      <Cancel onClick={() => setEditModuleId(null)} />
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[12.5px]">{m.name}</span>
                      <span className="text-[11px] text-ink/45">
                        {dir.projects.find((p) => p.id === m.projectId)?.name ?? "—"}
                      </span>
                      <Edit
                        onClick={() => {
                          setEditModuleId(m.id);
                          setEditModule({ name: m.name, projectId: m.projectId ?? "" });
                        }}
                      />
                      <Remove onClick={() => void removeRow("modules", m.id)} />
                    </>
                  )}
                </div>
              ))}
              {dir.modules.length === 0 && <Empty>No modules yet.</Empty>}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/80 p-4">
      <div className="mb-3">
        <h1 className="text-[16px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-0.5 font-mono text-[11px] text-ink/45">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="focus:ring-brand/25 h-8 w-full min-w-0 rounded-lg border border-border bg-muted px-2.5 text-[12px] outline-none focus:ring-2"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full min-w-0 rounded-md border border-border bg-background px-2 text-[11.5px] font-medium"
    >
      {children}
    </select>
  );
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="from-brand-light to-brand h-8 rounded-lg bg-gradient-to-b px-3 text-[11.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.5)]"
    >
      {children}
    </button>
  );
}

function Edit({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Edit"
      className="text-ink/40 hover:text-brand rounded-md px-1.5 text-[12px] transition"
    >
      ✎
    </button>
  );
}

function Save({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="from-brand-light to-brand h-7 rounded-lg bg-gradient-to-b px-2.5 text-[11px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.5)]"
    >
      Save
    </button>
  );
}

function Cancel({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-7 rounded-lg border border-border bg-card/70 px-2.5 text-[11px] font-medium text-ink/60 hover:bg-accent"
    >
      Cancel
    </button>
  );
}

function Remove({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Remove"
      className="text-ink/30 hover:text-rose-600 rounded-md px-1.5 text-[12px] transition"
    >
      ✕
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-8 text-center font-mono text-[11px] text-ink/45">
      {children}
    </div>
  );
}
