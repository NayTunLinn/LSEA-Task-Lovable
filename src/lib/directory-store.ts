import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = { id: string; name: string };
export type Department = { id: string; name: string };
export type Project = { id: string; name: string; code: string; description: string };
export type ModuleRow = { id: string; name: string; projectId: string | null; sortOrder: number };
export type Person = {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  departmentId: string | null;
  active: boolean;
};

export type ProjectMember = { id: string; projectId: string; personId: string };

export type Directory = {
  roles: Role[];
  departments: Department[];
  projects: Project[];
  modules: ModuleRow[];
  people: Person[];
  members: ProjectMember[];
};

const empty: Directory = {
  roles: [],
  departments: [],
  projects: [],
  modules: [],
  people: [],
  members: [],
};

let state: Directory = empty;
let ready = false;
let started = false;
const listeners = new Set<(d: Directory, ready: boolean) => void>();

function emit() {
  for (const l of listeners) l(state, ready);
}

async function fetchAll() {
  const [roles, departments, projects, modules, people, members] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    supabase.from("departments").select("*").order("name"),
    supabase.from("projects").select("*").order("name"),
    supabase.from("modules").select("*").order("sort_order"),
    supabase.from("people").select("*").order("name"),
    supabase.from("project_members").select("*"),
  ]);

  state = {
    roles: (roles.data ?? []).map((r) => ({ id: r.id, name: r.name })),
    departments: (departments.data ?? []).map((d) => ({ id: d.id, name: d.name })),
    projects: (projects.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description ?? "",
    })),
    modules: (modules.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      projectId: m.project_id,
      sortOrder: m.sort_order,
    })),
    people: (people.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email ?? "",
      roleId: p.role_id,
      departmentId: p.department_id,
      active: p.active,
    })),
    members: (members.data ?? []).map((m) => ({
      id: m.id,
      projectId: m.project_id,
      personId: m.person_id,
    })),
  };
  ready = true;
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchAll();

  supabase
    .channel("directory-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "roles" }, () => void fetchAll())
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "departments" },
      () => void fetchAll(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projects" },
      () => void fetchAll(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "modules" },
      () => void fetchAll(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "people" },
      () => void fetchAll(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "project_members" },
      () => void fetchAll(),
    )
    .subscribe();
}

export async function addRole(name: string) {
  await supabase.from("roles").insert({ name });
  await fetchAll();
}
export async function addDepartment(name: string) {
  await supabase.from("departments").insert({ name });
  await fetchAll();
}
export async function addProject(name: string, code: string, description = "") {
  await supabase.from("projects").insert({ name, code, description });
  await fetchAll();
}
export async function addModule(name: string, projectId: string | null) {
  await supabase
    .from("modules")
    .insert({ name, project_id: projectId, sort_order: state.modules.length + 1 });
  await fetchAll();
}
export async function addPerson(p: {
  name: string;
  email: string;
  roleId: string | null;
  departmentId: string | null;
}) {
  await supabase
    .from("people")
    .insert({ name: p.name, email: p.email, role_id: p.roleId, department_id: p.departmentId });
  await fetchAll();
}
export async function updatePerson(id: string, patch: Partial<Person>) {
  await supabase
    .from("people")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.roleId !== undefined ? { role_id: patch.roleId } : {}),
      ...(patch.departmentId !== undefined ? { department_id: patch.departmentId } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
    })
    .eq("id", id);
  await fetchAll();
}
export async function updateRole(id: string, name: string) {
  await supabase.from("roles").update({ name }).eq("id", id);
  await fetchAll();
}
export async function updateDepartment(id: string, name: string) {
  await supabase.from("departments").update({ name }).eq("id", id);
  await fetchAll();
}
export async function updateProject(
  id: string,
  patch: { name?: string; code?: string; description?: string },
) {
  await supabase.from("projects").update(patch).eq("id", id);
  await fetchAll();
}
export async function updateModule(
  id: string,
  patch: { name?: string; projectId?: string | null },
) {
  await supabase
    .from("modules")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.projectId !== undefined ? { project_id: patch.projectId } : {}),
    })
    .eq("id", id);
  await fetchAll();
}
export async function removeRow(
  table: "roles" | "departments" | "projects" | "modules" | "people",
  id: string,
) {
  await supabase.from(table).delete().eq("id", id);
  await fetchAll();
}
export async function addProjectMember(projectId: string, personId: string) {
  await supabase.from("project_members").insert({ project_id: projectId, person_id: personId });
  await fetchAll();
}
export async function removeProjectMember(id: string) {
  await supabase.from("project_members").delete().eq("id", id);
  await fetchAll();
}

export function useDirectory() {
  const [dir, setDir] = useState<Directory>(state);
  const [hydrated, setHydrated] = useState(ready);

  useEffect(() => {
    start();
    setDir(state);
    setHydrated(ready);
    const l = (d: Directory, r: boolean) => {
      setDir(d);
      setHydrated(r);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const refresh = useCallback(() => fetchAll(), []);

  return { ...dir, hydrated, refresh };
}
