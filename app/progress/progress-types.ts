export type SubtaskProgress = {
  id: string;
  description: string;
  completed: boolean;
  display_order: number;
};

export type TaskProgress = {
  id: string;
  name: string;
  characterId: string | null;
  characterColor: string | null;
  subtasks: SubtaskProgress[];
};
