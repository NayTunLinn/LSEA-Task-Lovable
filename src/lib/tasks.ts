export type Status = "backlog" | "progress" | "review" | "done";
export type Priority = "P1" | "P2" | "P3";
export type Module = "Admin" | "License" | "Review" | "System" | "Upload" | "Quota";

export type Task = {
  id: string;
  code: string;
  title: string;
  detail: string;
  module: Module;
  status: Status;
  priority: Priority;
  updated: string;
  assignee: string;
};

export const STATUS_META: Record<Status, { label: string; chip: string; dot: string }> = {
  done: {
    label: "Done",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  progress: {
    label: "In progress",
    chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    dot: "bg-sky-500",
  },
  review: {
    label: "Review",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  backlog: {
    label: "Backlog",
    chip: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
};

export const STATUS_ORDER: Status[] = ["done", "progress", "review", "backlog"];

export const MODULE_CHIP: Record<Module, string> = {
  Admin: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
  License: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  Review: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
  System: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800",
  Upload: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  Quota: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
};

export const MODULES: Module[] = ["Admin", "License", "Review", "System", "Upload", "Quota"];

export const PRIORITY_CLASS: Record<Priority, string> = {
  P1: "text-rose-600 dark:text-rose-400",
  P2: "text-amber-600 dark:text-amber-400",
  P3: "text-zinc-500 dark:text-zinc-400",
};

export const SEED_TASKS: Task[] = [
  {
    id: "t1",
    code: "LSEA-101",
    title: "Admin can edit member personal info + notify member",
    detail:
      "Admin edits a member's personal information. On save, notify the associated member or account and write a field-level entry to the audit trail.",
    module: "Admin",
    status: "progress",
    priority: "P1",
    updated: "2h",
    assignee: "Amara K.",
  },
  {
    id: "t2",
    code: "LSEA-102",
    title: "Show local & foreign bank fields in License Form",
    detail: "Remove the local/foreign toggle and render both bank field sets inline in the License Form.",
    module: "License",
    status: "progress",
    priority: "P1",
    updated: "5h",
    assignee: "Ravi S.",
  },
  {
    id: "t3",
    code: "LSEA-103",
    title: "Cover letter upload: accept PDF / JPG / PNG",
    detail:
      "Cover letter is currently DOCX only. Change the output format to PDF and allow uploads of PDF / JPG / PNG, matching the other upload fields.",
    module: "Upload",
    status: "progress",
    priority: "P1",
    updated: "1d",
    assignee: "Daw Nu",
  },
  {
    id: "t4",
    code: "LSEA-104",
    title: "Add Excel Import Template in Company Quota",
    detail:
      "Provide a downloadable Excel import template for Company Quota. Period Sep 1 2026 – Aug 31 2027, to be confirmed by LSEA.",
    module: "Quota",
    status: "review",
    priority: "P2",
    updated: "1d",
    assignee: "Amara K.",
  },
  {
    id: "t5",
    code: "LSEA-105",
    title: "Align button + Member Start Date (Admin approve stage)",
    detail: "Adjust the UI alignment of the action button and the Member Start Date field in the admin approve stage.",
    module: "Admin",
    status: "backlog",
    priority: "P3",
    updated: "3d",
    assignee: "Ravi S.",
  },
  {
    id: "t6",
    code: "LSEA-106",
    title: "Notification panel: scrollbar, search & read-all",
    detail: "Add a scrollbar, a search function and a mark-all-as-read action to the notification panel.",
    module: "System",
    status: "progress",
    priority: "P1",
    updated: "4h",
    assignee: "Daw Nu",
  },
  {
    id: "t7",
    code: "LSEA-107",
    title: "Show notification center in menu",
    detail: "Surface the notification center in the main menu. It is already included in the Admin view.",
    module: "System",
    status: "backlog",
    priority: "P2",
    updated: "2d",
    assignee: "Ravi S.",
  },
  {
    id: "t8",
    code: "LSEA-108",
    title: "Letter batches form: redesign PPRD & MOC code entry",
    detail: "Change the UI design of the letter batches form for adding PPRD code and MOC code.",
    module: "License",
    status: "review",
    priority: "P2",
    updated: "6h",
    assignee: "Amara K.",
  },
  {
    id: "t9",
    code: "LSEA-109",
    title: "Adjust SignalR to refresh user active pages",
    detail: "Tune the SignalR connection so a user's currently active pages refresh when related data changes.",
    module: "System",
    status: "progress",
    priority: "P1",
    updated: "3h",
    assignee: "Ravi S.",
  },
  {
    id: "t10",
    code: "LSEA-110",
    title: "Audit Trail: remove User column, add User Name + Email",
    detail: "Update the Audit Trail table: drop the User column and add User Name and Email columns.",
    module: "Admin",
    status: "done",
    priority: "P3",
    updated: "4d",
    assignee: "Daw Nu",
  },
  {
    id: "t11",
    code: "LSEA-111",
    title: "Application Review: filter side panel",
    detail: "Add a filter side panel to Application Review. Default filter excludes active members' applications.",
    module: "Review",
    status: "progress",
    priority: "P2",
    updated: "8h",
    assignee: "Amara K.",
  },
  {
    id: "t12",
    code: "LSEA-112",
    title: "License Review: filter panel, default incomplete only",
    detail:
      "Add a filter side panel to License Review with a default filter showing incomplete licenses only. Note: two letter numbers assigned and admin approved = completed stage.",
    module: "Review",
    status: "backlog",
    priority: "P2",
    updated: "5d",
    assignee: "Ravi S.",
  },
  {
    id: "t13",
    code: "LSEA-113",
    title: "Persist filters in cookies / session",
    detail: "Filtering state must be saved in cookies or session so it survives navigation and reload.",
    module: "System",
    status: "progress",
    priority: "P1",
    updated: "7h",
    assignee: "Daw Nu",
  },
  {
    id: "t14",
    code: "LSEA-114",
    title: "Export Certificate + Member card as Word & PDF",
    detail: "Certificate and Member card must be exportable as both Word and PDF documents.",
    module: "License",
    status: "review",
    priority: "P2",
    updated: "1d",
    assignee: "Amara K.",
  },
];
