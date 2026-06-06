
export type SubjectId = string;
export type AppMode = 'classroom' | 'teacher';

export interface Concept {
  id: string;
  title: string;
  icon: string;
  description: string;
  suggestedItems: string[];
  isArchived?: boolean;
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
  type: 'text' | 'emoji' | 'sticker' | 'shape' | 'song' | 'timer' | 'spinner';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string;
  metadata?: any;
}

export interface Whiteboard {
  id: string;
  conceptId?: string; // Optional: to filter history by concept
  name: string;
  timestamp: number;
  items: BoardItem[];
  bg: 'plain' | 'lined' | 'grid';
  bgColor?: string;
  drawingData?: string; // Legacy inline DataURL (migration source)
  drawingStoragePath?: string;
  drawingSignedUrl?: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  customIcons?: any[];
  hiddenDrawerItems?: string[];
  customDrawerLabels?: Record<string, string[]>;
}

export interface MaterialFile {
  id: string;
  name: string;
  type: 'pdf' | 'slides' | 'video';
  subjectId: string;
  timestamp: number;
  thumbnailUrl?: string;
  content?: string; // Legacy inline DataURL/external url (migration source)
  storagePath?: string;
  signedUrl?: string;
  mimeType?: string;
  byteSize?: number;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  icon: string;
  url: string;
  category: string;
  lyrics?: string[];
  assignedSubjectIds?: string[]; // Subject IDs this song is assigned to
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  category: string;
  assignedSubjectIds?: string[];
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
  spinnerNames?: string[];
  availableCustomIcons?: any[];
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
  songs?: Song[];
  games?: Game[];
  calendarData?: {
    events: Record<string, any[]>;
  };
  storageMigratedAt?: string | null;
  storageSchemaVersion?: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
