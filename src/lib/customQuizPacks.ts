import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';
import { Question } from './quizTypes';

export type CustomQuizPack = {
  id: string;
  url: string;
  label: string;
  description: string;
  questions: Question[];
};

// Thrown with a machine-readable `code` (mapped to quiz.customImportError.*
// translation keys by the caller) rather than a hardcoded message, since
// this can surface in any of the app's languages.
export class QuizPackImportError extends Error {
  code: string;
  params?: Record<string, string | number>;
  constructor(code: string, params?: Record<string, string | number>) {
    super(code);
    this.code = code;
    this.params = params;
  }
}

const MAX_PACKS = 10;
const MAX_QUESTIONS = 200;
const MAX_RESPONSE_CHARS = 500_000;
const MAX_LABEL_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 200;

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateQuestion(raw: unknown): Question {
  if (typeof raw !== 'object' || raw === null) {
    throw new QuizPackImportError('invalidQuestion');
  }
  const q = raw as Record<string, unknown>;
  if (!isNonEmptyString(q.prompt)) {
    throw new QuizPackImportError('invalidPrompt');
  }
  const image = q.image !== undefined ? q.image : undefined;
  if (image !== undefined && typeof image !== 'string') {
    throw new QuizPackImportError('invalidImage');
  }

  if (q.mode === 'choice') {
    if (!isNonEmptyString(q.answer)) throw new QuizPackImportError('invalidChoiceAnswer');
    return { mode: 'choice', prompt: q.prompt as string, answer: q.answer as string, image };
  }
  if (q.mode === 'text') {
    if (!Array.isArray(q.answers) || q.answers.length === 0 || !q.answers.every(isNonEmptyString)) {
      throw new QuizPackImportError('invalidTextAnswers');
    }
    return { mode: 'text', prompt: q.prompt as string, answers: q.answers as string[], image };
  }
  if (q.mode === 'date') {
    const month = q.month;
    const day = q.day;
    if (
      typeof month !== 'number' || month < 1 || month > 12 ||
      typeof day !== 'number' || day < 1 || day > 31
    ) {
      throw new QuizPackImportError('invalidDateFields');
    }
    return { mode: 'date', prompt: q.prompt as string, month, day, image };
  }
  throw new QuizPackImportError('invalidMode');
}

function validatePack(raw: unknown, url: string): CustomQuizPack {
  if (typeof raw !== 'object' || raw === null) {
    throw new QuizPackImportError('invalidJsonShape');
  }
  const data = raw as Record<string, unknown>;
  if (!isNonEmptyString(data.label) || (data.label as string).length > MAX_LABEL_LENGTH) {
    throw new QuizPackImportError('invalidLabel', { max: MAX_LABEL_LENGTH });
  }
  const description = isNonEmptyString(data.description)
    ? (data.description as string).slice(0, MAX_DESCRIPTION_LENGTH)
    : '';
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new QuizPackImportError('invalidQuestions');
  }
  if (data.questions.length > MAX_QUESTIONS) {
    throw new QuizPackImportError('tooManyQuestions', { max: MAX_QUESTIONS });
  }
  const questions = data.questions.map(validateQuestion);

  return {
    id: hashUrl(url),
    url,
    label: data.label as string,
    description,
    questions,
  };
}

export async function loadCustomQuizPacks(): Promise<CustomQuizPack[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.customQuizPacks);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addCustomQuizPackFromUrl(url: string): Promise<CustomQuizPack> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new QuizPackImportError('invalidUrl');
  }

  const existing = await loadCustomQuizPacks();
  const id = hashUrl(trimmed);
  const alreadyHasThisUrl = existing.some((p) => p.id === id);
  if (!alreadyHasThisUrl && existing.length >= MAX_PACKS) {
    throw new QuizPackImportError('tooManyPacks', { max: MAX_PACKS });
  }

  let response: Response;
  try {
    response = await fetch(trimmed);
  } catch {
    throw new QuizPackImportError('networkError');
  }
  if (!response.ok) {
    throw new QuizPackImportError('fetchFailed', { status: response.status });
  }
  const text = await response.text();
  if (text.length > MAX_RESPONSE_CHARS) {
    throw new QuizPackImportError('tooLarge');
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new QuizPackImportError('invalidJson');
  }

  const pack = validatePack(json, trimmed);
  const next = [...existing.filter((p) => p.id !== pack.id), pack];
  await AsyncStorage.setItem(STORAGE_KEYS.customQuizPacks, JSON.stringify(next));
  return pack;
}

export async function removeCustomQuizPack(id: string): Promise<CustomQuizPack[]> {
  const existing = await loadCustomQuizPacks();
  const next = existing.filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.customQuizPacks, JSON.stringify(next));
  return next;
}
