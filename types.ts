
export type SubjectId = string;
export type AppMode = 'classroom' | 'teacher';

export interface Concept {
  id: string;
  title: string;
  icon: string;
  description: string;
  suggestedItems: string[];
}

export interface Subject {
  id: SubjectId;
  title: string;
  description?: string;
  color: string;
  concepts: Concept[];
  icon?: string;
}

export interface BoardItem {
  id: string;
  content: string;
  type: 'text' | 'emoji' | 'sticker' | 'shape';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string;
}

export interface ClassroomDesign {
  wallColor: string;
  wallTheme?: 'plain' | 'stripes' | 'dots';
  floorColor: string;
  floorTheme?: 'plain' | 'wood' | 'tile';
  posterUrls: string[];
  ambientMusic: string;
  mascot?: string; // 'none', 'cat', 'dog', 'owl', 'robot'
  shelves?: string[]; // list of object emojis/ids
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  customSubjects: Subject[];
  hiddenSubjectIds: string[];
  classroomDesigns: Record<SubjectId, ClassroomDesign>;
  progress: Record<string, number>;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
