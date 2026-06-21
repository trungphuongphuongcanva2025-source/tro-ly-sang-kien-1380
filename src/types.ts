export enum InitiativeLevel {
  CO_SO = "Cơ sở",
  CAP_TINH = "Cấp tỉnh"
}

export interface InitiativeInput {
  rawIdea: string;
  level: InitiativeLevel | "both";
  subject: string;
  targetStudents: string;
  coreProblem: string;
  goal: string;
  textbook: string; // "Kết nối tri thức với cuộc sống" is default
  schoolLevel?: "Tiểu học" | "THCS" | "THPT" | string;
  schoolName?: string;
  province?: string;
}

export interface SuggestedName {
  id: string;
  name: string;
  reason: string;
  level: InitiativeLevel;
  strengths: string;
}

export interface SuggestionResponse {
  analysis: {
    subject: string;
    target: string;
    coreProblem: string;
    goal: string;
  };
  suggestions: SuggestedName[];
}

export interface SavedInitiative {
  id: string;
  title: string;
  level: InitiativeLevel;
  inputData: InitiativeInput;
  createdAt: string;
  content?: string;
}
