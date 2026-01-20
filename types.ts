
export type SubjectId = 'phonics' | 'math' | 'science';
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
  color: string;
  concepts: Concept[];
}

export interface ClassroomDesign {
  wallColor: string;
  floorColor: string;
  posterUrls: string[];
  ambientMusic: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional because we don't send it back to the state in the same way
  classroomDesigns: Record<SubjectId, ClassroomDesign>;
  progress: Record<string, number>;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
