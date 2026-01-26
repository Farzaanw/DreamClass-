
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

export interface Whiteboard {
  id: string;
  conceptId?: string; // Optional: to filter history by concept
  name: string;
  timestamp: number;
  items: BoardItem[];
  bg: 'plain' | 'lined' | 'grid';
  drawingData?: string; // DataURL of the canvas layer
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface MaterialFile {
  id: string;
  name: string;
  type: 'pdf' | 'slides' | 'video';
  subjectId: string;
  timestamp: number;
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
  whiteboards?: Whiteboard[]; // General history
  conceptBoards?: Record<string, Whiteboard>; // Mapping of conceptId -> current saved state
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
  materials?: MaterialFile[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
