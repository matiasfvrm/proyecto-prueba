export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "questions", label: "Research Questions" },
  { id: "tasks", label: "Tasks" },
  { id: "contributions", label: "Contributions" },
  { id: "evidence", label: "Evidence" },
] as const;
export type TabId = (typeof TABS)[number]["id"];
