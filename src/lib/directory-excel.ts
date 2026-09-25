import type { Cell, Column, Row as ExcelRow, Worksheet } from "exceljs";
import type { Directory } from "./directory-store";
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, string | number | boolean | null | undefined>;

const columns = {
  people: [
    "Name / အမည်",
    "Email / အီးမေးလ်",
    "Role / ရာထူး",
    "Department / ဌာန",
    "Active / အသုံးပြုနေသည်",
  ],
  roles: ["Name / အမည်"],
  departments: ["Name / အမည်"],
  projects: ["Name / အမည်", "Code / ကုဒ်", "Description / ဖော်ပြချက်"],
  modules: ["Name / အမည်", "Project Code / Project ကုဒ်", "Sort Order / စဉ်"],
} as const;

function value(row: Row, column: string) {
  return row[column] == null ? "" : String(row[column]).trim();
}

function download(buffer: ArrayBuffer, filename: string) {
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function getExcelJS() {
  const module = await import("exceljs");
  return module.default;
}

function styleSheet(sheet: Worksheet, headerLength: number) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell((cell: Cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF315E72" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headerLength } };
  sheet.columns.forEach((column: Partial<Column>) => {
    column.width = Math.min(Math.max(column.header?.length ?? 14, 16), 32);
  });
}

function addSheet(
  workbook: { addWorksheet: (name: string) => Worksheet },
  name: string,
  headers: readonly string[],
  rows: Row[],
) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([...headers]);
  rows.forEach((row) => sheet.addRow(headers.map((header) => row[header] ?? "")));
  styleSheet(sheet, headers.length);
  return sheet;
}

function directoryRows(directory: Directory) {
  const roles = new Map(directory.roles.map((item) => [item.id, item.name]));
  const departments = new Map(directory.departments.map((item) => [item.id, item.name]));
  const projects = new Map(directory.projects.map((item) => [item.id, item]));
  return {
    people: directory.people.map((person) => ({
      [columns.people[0]]: person.name,
      [columns.people[1]]: person.email,
      [columns.people[2]]: roles.get(person.roleId ?? "") ?? "",
      [columns.people[3]]: departments.get(person.departmentId ?? "") ?? "",
      [columns.people[4]]: person.active ? "Yes" : "No",
    })),
    roles: directory.roles.map((item) => ({ [columns.roles[0]]: item.name })),
    departments: directory.departments.map((item) => ({ [columns.departments[0]]: item.name })),
    projects: directory.projects.map((item) => ({
      [columns.projects[0]]: item.name,
      [columns.projects[1]]: item.code,
      [columns.projects[2]]: item.description,
    })),
    modules: directory.modules.map((item) => ({
      [columns.modules[0]]: item.name,
      [columns.modules[1]]: projects.get(item.projectId ?? "")?.code ?? "",
      [columns.modules[2]]: item.sortOrder,
    })),
  };
}

export async function downloadDirectoryWorkbook(directory: Directory, templateOnly = false) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Task Board";
  workbook.created = new Date();
  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRows([
    ["Task Board directory import template"],
    ["တင်သွင်းရန် template — bilingual column labels are kept compatible with the app."],
    ["Fill the five data sheets. Do not rename the sheet names or header rows."],
    ["အချက်အလက်စာရွက်များကို ဖြည့်ပြီး sheet name နှင့် header row များကို မပြောင်းပါနှင့်။"],
  ]);
  instructions.getColumn(1).width = 100;
  instructions.getRow(1).font = { bold: true, size: 16, color: { argb: "FF315E72" } };
  instructions.getRow(2).font = { italic: true, color: { argb: "FF52707D" } };
  const rows = templateOnly
    ? { people: [], roles: [], departments: [], projects: [], modules: [] }
    : directoryRows(directory);
  addSheet(workbook, "People", columns.people, rows.people);
  addSheet(workbook, "Roles", columns.roles, rows.roles);
  addSheet(workbook, "Departments", columns.departments, rows.departments);
  addSheet(workbook, "Projects", columns.projects, rows.projects);
  addSheet(workbook, "Modules", columns.modules, rows.modules);
  const buffer = await workbook.xlsx.writeBuffer();
  download(
    buffer as ArrayBuffer,
    templateOnly ? "task-board-directory-template.xlsx" : "task-board-directory.xlsx",
  );
}

export type DirectoryImport = {
  roles: { name: string }[];
  departments: { name: string }[];
  projects: { name: string; code: string; description: string }[];
  modules: { name: string; projectCode: string; sortOrder: number }[];
  people: { name: string; email: string; role: string; department: string; active: boolean }[];
};

export async function readDirectoryWorkbook(file: File): Promise<DirectoryImport> {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const read = (sheetName: string, headers: readonly string[]) => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) return [] as Row[];
    const result: Row[] = [];
    sheet.eachRow((row: ExcelRow, rowNumber: number) => {
      if (rowNumber === 1) return;
      const item: Row = {};
      headers.forEach((header, index) => {
        item[header] = row.getCell(index + 1).value as string | number | boolean | null;
      });
      if (headers.some((header) => value(item, header))) result.push(item);
    });
    return result;
  };
  return {
    roles: read("Roles", columns.roles)
      .map((row) => ({ name: value(row, columns.roles[0]) }))
      .filter((row) => row.name),
    departments: read("Departments", columns.departments)
      .map((row) => ({ name: value(row, columns.departments[0]) }))
      .filter((row) => row.name),
    projects: read("Projects", columns.projects)
      .map((row) => ({
        name: value(row, columns.projects[0]),
        code: value(row, columns.projects[1]).toUpperCase(),
        description: value(row, columns.projects[2]),
      }))
      .filter((row) => row.name && row.code),
    modules: read("Modules", columns.modules)
      .map((row) => ({
        name: value(row, columns.modules[0]),
        projectCode: value(row, columns.modules[1]).toUpperCase(),
        sortOrder: Number(row[columns.modules[2]]) || 0,
      }))
      .filter((row) => row.name),
    people: read("People", columns.people)
      .map((row) => ({
        name: value(row, columns.people[0]),
        email: value(row, columns.people[1]),
        role: value(row, columns.people[2]),
        department: value(row, columns.people[3]),
        active: !["no", "false", "0"].includes(value(row, columns.people[4]).toLowerCase()),
      }))
      .filter((row) => row.name),
  };
}

export async function persistDirectoryImport(data: DirectoryImport) {
  const existing = await Promise.all([
    supabase.from("roles").select("id,name"),
    supabase.from("departments").select("id,name"),
    supabase.from("projects").select("id,name,code,description"),
    supabase.from("modules").select("id,name,project_id,sort_order"),
    supabase.from("people").select("id,name,email"),
  ]);
  const roleNames = new Set((existing[0].data ?? []).map((row) => row.name.toLowerCase()));
  const departmentNames = new Set((existing[1].data ?? []).map((row) => row.name.toLowerCase()));
  const projectCodes = new Set((existing[2].data ?? []).map((row) => row.code.toUpperCase()));
  const roles = data.roles
    .filter((row) => row.name && !roleNames.has(row.name.toLowerCase()))
    .map((row) => ({ name: row.name }));
  const departments = data.departments
    .filter((row) => row.name && !departmentNames.has(row.name.toLowerCase()))
    .map((row) => ({ name: row.name }));
  const projects = data.projects
    .filter((row) => row.name && row.code && !projectCodes.has(row.code.toUpperCase()))
    .map((row) => ({ name: row.name, code: row.code, description: row.description }));
  if (roles.length) await supabase.from("roles").insert(roles);
  if (departments.length) await supabase.from("departments").insert(departments);
  if (projects.length) await supabase.from("projects").insert(projects);
  const latest = await Promise.all([
    supabase.from("roles").select("id,name"),
    supabase.from("departments").select("id,name"),
    supabase.from("projects").select("id,name,code,description"),
    supabase.from("modules").select("id,name,project_id"),
    supabase.from("people").select("id,name,email"),
  ]);
  const roleIds = new Map((latest[0].data ?? []).map((row) => [row.name.toLowerCase(), row.id]));
  const departmentIds = new Map(
    (latest[1].data ?? []).map((row) => [row.name.toLowerCase(), row.id]),
  );
  const projectIds = new Map((latest[2].data ?? []).map((row) => [row.code.toUpperCase(), row.id]));
  const moduleKeys = new Set(
    (latest[3].data ?? []).map((row) => `${row.project_id ?? ""}:${row.name.toLowerCase()}`),
  );
  const peopleKeys = new Set(
    (latest[4].data ?? []).map(
      (row) => `${row.name.toLowerCase()}:${(row.email ?? "").toLowerCase()}`,
    ),
  );
  const modules = data.modules
    .filter(
      (row) =>
        row.name &&
        !moduleKeys.has(`${projectIds.get(row.projectCode) ?? ""}:${row.name.toLowerCase()}`),
    )
    .map((row) => ({
      name: row.name,
      project_id: projectIds.get(row.projectCode) ?? null,
      sort_order: row.sortOrder || 1,
    }));
  const people = data.people
    .filter(
      (row) => row.name && !peopleKeys.has(`${row.name.toLowerCase()}:${row.email.toLowerCase()}`),
    )
    .map((row) => ({
      name: row.name,
      email: row.email,
      role_id: roleIds.get(row.role.toLowerCase()) ?? null,
      department_id: departmentIds.get(row.department.toLowerCase()) ?? null,
      active: row.active,
    }));
  if (modules.length) await supabase.from("modules").insert(modules);
  if (people.length) await supabase.from("people").insert(people);
  return {
    roles: roles.length,
    departments: departments.length,
    projects: projects.length,
    modules: modules.length,
    people: people.length,
  };
}
