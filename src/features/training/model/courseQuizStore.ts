import { useSyncExternalStore } from 'react';
import {
  questionDifficulties,
  questionTypes,
  type QuestionDifficulty,
  type QuestionType,
} from '../../exams/model/question';

export type CourseQuizBankRule = {
  id: number;
  categoryId: number;
  types: QuestionType[];
  difficulties: QuestionDifficulty[];
  questionCount: number;
};

export type CourseQuizConfig = {
  enabled: boolean;
  banks: CourseQuizBankRule[];
};

export function defaultCourseQuizConfig(): CourseQuizConfig {
  return {
    enabled: false,
    banks: [],
  };
}

export function createEmptyCourseQuizBank(): CourseQuizBankRule {
  return {
    id: Date.now(),
    categoryId: 0,
    types: [],
    difficulties: [],
    questionCount: 1,
  };
}

function normalizeTypes(value: unknown): QuestionType[] {
  if (!Array.isArray(value)) return [];
  return questionTypes.filter((item) => value.includes(item));
}

function normalizeDifficulties(value: unknown): QuestionDifficulty[] {
  if (!Array.isArray(value)) return [];
  return questionDifficulties.filter((item) => value.includes(item));
}

export function normalizeCourseQuizBankRule(rule?: Partial<CourseQuizBankRule> | null): CourseQuizBankRule | null {
  if (!rule || typeof rule.categoryId !== 'number' || rule.categoryId <= 0) return null;
  const questionCount = typeof rule.questionCount === 'number' ? Math.floor(rule.questionCount) : 0;
  if (questionCount <= 0) return null;
  const types = normalizeTypes(rule.types);
  const difficulties = normalizeDifficulties(rule.difficulties);
  if (!types.length || !difficulties.length) return null;
  return {
    id: typeof rule.id === 'number' ? rule.id : Date.now(),
    categoryId: rule.categoryId,
    types,
    difficulties,
    questionCount,
  };
}

export function normalizeCourseQuizConfig(config?: Partial<CourseQuizConfig> | null): CourseQuizConfig {
  const base = defaultCourseQuizConfig();
  if (!config) return base;
  return {
    enabled: config.enabled ?? base.enabled,
    banks: Array.isArray(config.banks)
      ? config.banks.map((item) => normalizeCourseQuizBankRule(item)).filter((item): item is CourseQuizBankRule => Boolean(item))
      : [],
  };
}

const STORAGE_KEY = 'kangni.training.courseQuizConfigs.v2';

function loadPersisted(): Record<string, CourseQuizConfig> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CourseQuizConfig>>;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([id, value]) => [id, normalizeCourseQuizConfig(value)]),
    );
  } catch {
    return {};
  }
}

let configs: Record<string, CourseQuizConfig> = loadPersisted();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function save() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // ignore
  }
}

export function getCourseQuizConfig(courseId: number): CourseQuizConfig {
  return normalizeCourseQuizConfig(configs[String(courseId)]);
}

export function updateCourseQuizConfig(courseId: number, config: CourseQuizConfig): CourseQuizConfig {
  const next = normalizeCourseQuizConfig(config);
  configs = { ...configs, [String(courseId)]: next };
  save();
  emit();
  return next;
}

const emptyConfig = defaultCourseQuizConfig();

export function useAllCourseQuizConfigs(): Record<string, CourseQuizConfig> {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => configs,
    () => configs,
  );
}

export function useCourseQuizConfig(courseId: number): CourseQuizConfig {
  const all = useAllCourseQuizConfigs();
  return all[String(courseId)] ?? emptyConfig;
}
