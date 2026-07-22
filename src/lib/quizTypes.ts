export type ChoiceQuestion = { mode: 'choice'; prompt: string; answer: string; image?: string };
export type TextQuestion = { mode: 'text'; prompt: string; answers: string[]; image?: string };
export type DateQuestion = { mode: 'date'; prompt: string; month: number; day: number; image?: string };
export type Question = ChoiceQuestion | TextQuestion | DateQuestion;
