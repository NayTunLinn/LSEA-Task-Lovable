/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import type { TaskDetailed } from "./task-store";
import type { Module, Priority, Status } from "./tasks";

const headers = [
  "ID",
  "Code / ကုဒ်",
  "Title / ခေါင်းစဉ်",
  "Detail / အသေးစိတ်",
  "Module / အပိုင်း",
  "Status / အခြေအနေ",
  "Priority / ဦးစားပေး",
  "Assignee / တာဝန်ခံ",
  "Updated / ပြင်ဆင်ချိန်",
  "Notes / မှတ်ချက်",
  "Sort Order / စဉ်",
] as const;

const statuses: Status[] = ["backlog", "progress", "review", "done"];
const priorities: Priority[] = ["P1", "P2", "P3"];
const modules: Module[] = ["Admin", "License", "Review", "System", "Upload", "Quota"];

type Row = Record<string, string | number | null | undefined>;

async function getExcelJS() {
  const module = await import("exceljs");
  return module.default;
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
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function text(row: Row, header: string) {
  return row[header] == null ? "" : String(row[header]).trim();
}

function formatSheet(sheet: any) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF315E72" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  sheet.columns.forEach((column: any) => {
    column.width = Math.min(Math.max(column.header?.length ?? 14, 14), 38);
  });
  sheet.getColumn(4).width = 52;
  sheet.getColumn(10).width = 32;
}

export async function downloadTaskWorkbook(
  tasks: TaskDetailed[],
  project?: { code: string; name: string } | null,
  templateOnly = false,
) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Task Board";
  workbook.created = new Date();
  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRows([
    ["Task Board task import template"],
    ["Fill the Tasks sheet. Status: backlog, progress, review, done. Priority: P1, P2, P3."],
    ["Module must be one of: Admin, License, Review, System, Upload, Quota."],
    ["တင်သွင်းရန် Tasks စာရွက်ကို ဖြည့်ပါ။ Code တူပါက task အဟောင်းကို ပြင်ဆင်ပါမည်။"],
  ]);
  instructions.getColumn(1).width = 110;
  instructions.getRow(1).font = { bold: true, size: 16, color: { argb: "FF315E72" } };
  instructions.getRow(2).font = { color: { argb: "FF52707D" } };
  const sheet = workbook.addWorksheet("Tasks");
  sheet.addRow([...headers]);
  if (!templateOnly) {
    tasks.forEach((task) =>
      sheet.addRow([
        task.id,
        task.code,
        task.title,
        task.detail,
        task.module,
        task.status,
        task.priority,
        task.assignee,
        task.updated,
        task.notes ?? "",
        task.sortOrder ?? 0,
      ]),
    );
  }
  formatSheet(sheet);
  const buffer = await workbook.xlsx.writeBuffer();
  const suffix = project?.code ? `-${project.code.toLowerCase()}` : "";
  download(
    buffer as ArrayBuffer,
    templateOnly ? "task-list-template.xlsx" : `task-list${suffix}.xlsx`,
  );
}

export type TaskImport = {
  id: string;
  code: string;
  title: string;
  detail: string;
  module: Module;
  status: Status;
  priority: Priority;
  assignee: string;
  updated: string;
  notes: string;
  sortOrder: number;
};

export async function readTaskWorkbook(file: File): Promise<TaskImport[]> {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet("Tasks");
  if (!sheet) throw new Error("The workbook must contain a Tasks sheet.");
  const rows: TaskImport[] = [];
  sheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber === 1) return;
    const item: Row = {};
    headers.forEach((header, index) => {
      item[header] = row.getCell(index + 1).value as string | number | null;
    });
    if (!headers.some((header) => text(item, header))) return;
    const module = text(item, headers[4]) as Module;
    const status = text(item, headers[5]) as Status;
    const priority = text(item, headers[6]) as Priority;
    if (!text(item, headers[1]) || !text(item, headers[2]))
      throw new Error(`Row ${rowNumber}: Code and Title are required.`);
    if (!modules.includes(module)) throw new Error(`Row ${rowNumber}: invalid module "${module}".`);
    if (!statuses.includes(status))
      throw new Error(`Row ${rowNumber}: invalid status "${status}".`);
    if (!priorities.includes(priority))
      throw new Error(`Row ${rowNumber}: invalid priority "${priority}".`);
    rows.push({
      id: text(item, headers[0]),
      code: text(item, headers[1]),
      title: text(item, headers[2]),
      detail: text(item, headers[3]),
      module,
      status,
      priority,
      assignee: text(item, headers[7]) || "Unassigned",
      updated: text(item, headers[8]) || "now",
      notes: text(item, headers[9]),
      sortOrder: Number(item[headers[10]]) || 0,
    });
  });
  return rows;
}

export async function persistTaskImport(rows: TaskImport[], projectId: string | null) {
  if (!projectId) throw new Error("Select a project before importing tasks.");
  const [existingTasks, people] = await Promise.all([
    supabase.from("tasks").select("id,code,project_id").eq("project_id", projectId),
    supabase.from("people").select("id,name"),
  ]);
  const byCode = new Map((existingTasks.data ?? []).map((row) => [row.code.toLowerCase(), row.id]));
  const peopleByName = new Map((people.data ?? []).map((row) => [row.name.toLowerCase(), row.id]));
  let updated = 0;
  let created = 0;
  for (const row of rows) {
    const id = row.id || byCode.get(row.code.toLowerCase()) || `t${crypto.randomUUID()}`;
    const payload = {
      id,
      code: row.code,
      title: row.title,
      detail: row.detail,
      module: row.module,
      status: row.status,
      priority: row.priority,
      updated: row.updated,
      assignee: row.assignee,
      notes: row.notes,
      checklist: [],
      activity: [],
      sort_order: row.sortOrder,
      project_id: projectId,
      assignee_id: peopleByName.get(row.assignee.toLowerCase()) ?? null,
      updated_at: new Date().toISOString(),
    };
    const result = await supabase.from("tasks").upsert(payload, { onConflict: "id" });
    if (result.error) throw new Error(`Could not save ${row.code}: ${result.error.message}`);
    if (byCode.has(row.code.toLowerCase()) || row.id) updated += 1;
    else created += 1;
    byCode.set(row.code.toLowerCase(), id);
  }
  return { created, updated };
}
