export interface Thesis {
  title: string;
  content: string;
  metaphor: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SolutionStep {
  title: string;
  explanation: string;
  result: string;
}

export interface StepByStepProblem {
  problem: string;
  principles: string;
  steps: SolutionStep[];
}

export interface GeneratedLesson {
  themeTitle: string;
  missionBriefing: string;
  theses: Thesis[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  stepByStepProblems: StepByStepProblem[];
}

export interface Textbook {
  id: string;
  title: string;
  grade: "10" | "11" | string;
  subject: string;
  totalPages: number;
  // page number -> text content
  pages: { [pageNumber: number]: string };
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
