export type SubtaskProgress = {
  id: string;
  description: string;
  completed: boolean;
  display_order: number;
};

export type TaskProgress = {
  id: string;
  name: string;
  status: "upcoming" | "in_progress" | "completed";
  characterId: string | null;
  characterColor: string | null;
  subtasks: SubtaskProgress[];
};
