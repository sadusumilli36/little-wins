export type SubtaskProgress = {
  id: string;
  description: string;
  completed: boolean;
};

export type TaskProgress = {
  id: string;
  name: string;
  characterName: string;
  characterImage: string;
  subtasks: SubtaskProgress[];
};

export const MOCK_TASKS: TaskProgress[] = [
  {
    id: "task-1",
    name: "Clean the kitchen",
    characterName: "Mario",
    characterImage: "/characters/mario.png",
    subtasks: [
      { id: "t1-s1", description: "Clear the counters", completed: true },
      { id: "t1-s2", description: "Load the dishwasher", completed: true },
      { id: "t1-s3", description: "Wipe the stove", completed: false },
      { id: "t1-s4", description: "Take out the trash", completed: false },
    ],
  },
  {
    id: "task-2",
    name: "Finish history essay",
    characterName: "Peach",
    characterImage: "/characters/peach.png",
    subtasks: [
      { id: "t2-s1", description: "Pick a topic", completed: true },
      { id: "t2-s2", description: "Find three sources", completed: true },
      { id: "t2-s3", description: "Write the outline", completed: true },
      { id: "t2-s4", description: "Write the first draft", completed: false },
      { id: "t2-s5", description: "Proofread and submit", completed: false },
    ],
  },
  {
    id: "task-3",
    name: "Plan weekend trip",
    characterName: "Yoshi",
    characterImage: "/characters/yoshi.png",
    subtasks: [
      { id: "t3-s1", description: "Choose a destination", completed: false },
      { id: "t3-s2", description: "Book transportation", completed: false },
      {
        id: "t3-s3",
        description: "Reserve a place to stay",
        completed: false,
      },
      { id: "t3-s4", description: "Make a packing list", completed: false },
    ],
  },
  {
    id: "task-4",
    name: "Set up new laptop",
    characterName: "Donkey Kong",
    characterImage: "/characters/donkey-kong.png",
    subtasks: [
      { id: "t4-s1", description: "Install updates", completed: true },
      { id: "t4-s2", description: "Sign in to accounts", completed: false },
      { id: "t4-s3", description: "Install your apps", completed: false },
      { id: "t4-s4", description: "Back up old files", completed: false },
      { id: "t4-s5", description: "Set up printer", completed: false },
    ],
  },
];
