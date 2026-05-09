export type Confidence = "high" | "medium" | "low";
export type Priority = "high" | "medium" | "low";
export type Language = "he" | "en" | "mixed";

export interface Participant {
  name: string;
  role: string | null;
  confidence: Confidence;
}

export interface Decision {
  decision: string;
  context: string;
}

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: Priority | null;
}

export interface MeetingAnalysis {
  language: Language;
  title: string;
  summary: string;
  participants: Participant[];
  decisions: Decision[];
  action_items: ActionItem[];
  open_questions: string[];
}

export interface ProcessResult {
  transcript: string;
  analysis: MeetingAnalysis;
  duration_seconds: number | null;
}
