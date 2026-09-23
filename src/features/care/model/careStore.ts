import { useEffect, useState } from 'react';
import {
  initialDisplaySettings,
  initialEmojis,
  initialEmployees,
  initialRecords,
  initialRules,
  initialTemplates,
  movedEmojis,
  type CareDisplaySettings,
  type CareEmoji,
  type CareEmployee,
  type CareRule,
  type CareTemplate,
} from './care';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let employees = clone(initialEmployees);
let rules = clone(initialRules);
let templates = clone(initialTemplates);
const records = clone(initialRecords);
let emojis = clone(initialEmojis);
let displaySettings = clone(initialDisplaySettings);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function __resetCareStoreForTests() {
  employees = clone(initialEmployees);
  rules = clone(initialRules);
  templates = clone(initialTemplates);
  emojis = clone(initialEmojis);
  displaySettings = clone(initialDisplaySettings);
  emit();
}

function useList<T>(read: () => T) {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const listener = () => setValue(read());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [read]);
  return value;
}

export function listEmployees() {
  return employees;
}
export function getEmployee(id: string) {
  return employees.find((item) => item.id === id);
}
export function updateEmployee(id: string, patch: Partial<Omit<CareEmployee, 'id'>>) {
  employees = employees.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
}
export function useEmployees() {
  return useList(listEmployees);
}

export function listRules() {
  return rules;
}
export function getRule(id: string) {
  return rules.find((item) => item.id === id);
}
export function saveRule(record: CareRule) {
  if (record.id && rules.some((item) => item.id === record.id)) {
    rules = rules.map((item) => (item.id === record.id ? record : item));
  } else {
    rules = [{ ...record, id: record.id || `r-${Date.now()}` }, ...rules];
  }
  emit();
  return getRule(record.id) ?? rules[0];
}
export function setRuleStatus(id: string, status: CareRule['status']) {
  rules = rules.map((item) => (item.id === id ? { ...item, status } : item));
  emit();
}
export function removeRule(id: string) {
  rules = rules.filter((item) => item.id !== id);
  emit();
}
export function useRules() {
  return useList(listRules);
}

export function listTemplates() {
  return templates;
}
export function getTemplate(id: string) {
  return templates.find((item) => item.id === id);
}
export function saveTemplate(record: CareTemplate) {
  if (record.id && templates.some((item) => item.id === record.id)) {
    templates = templates.map((item) => (item.id === record.id ? record : item));
  } else {
    templates = [{ ...record, id: record.id || `t-${Date.now()}` }, ...templates];
  }
  emit();
  return getTemplate(record.id) ?? templates[0];
}
export function removeTemplate(id: string) {
  templates = templates.filter((item) => item.id !== id);
  emit();
}
export function useTemplates() {
  return useList(listTemplates);
}

export function listRecords() {
  return records;
}
export function useRecords() {
  return useList(listRecords);
}

export function listEmojis() {
  return emojis;
}
export function saveEmoji(record: CareEmoji) {
  if (record.id && emojis.some((item) => item.id === record.id)) {
    emojis = emojis.map((item) => (item.id === record.id ? { ...item, ...record, updatedAt: nowStamp() } : item));
  } else {
    emojis = [{ ...record, id: record.id || `e-${Date.now()}`, updatedAt: nowStamp() }, ...emojis];
  }
  emit();
}
export function removeEmoji(id: string) {
  emojis = emojis.filter((item) => item.id !== id);
  emit();
}
export function moveEmoji(id: string, direction: 'up' | 'down') {
  const next = movedEmojis(emojis, id, direction);
  if (next === emojis) return false;
  const previous = emojis;
  const stamp = nowStamp();
  emojis = next.map((item) => {
    const before = previous.find((row) => row.id === item.id);
    return before && before.sort !== item.sort ? { ...item, updatedAt: stamp } : item;
  });
  emit();
  return true;
}
export function useEmojis() {
  return useList(listEmojis);
}

export function getDisplaySettings() {
  return displaySettings;
}
export function setDisplaySettings(next: CareDisplaySettings) {
  displaySettings = next;
  emit();
}
export function useDisplaySettings() {
  return useList(getDisplaySettings);
}
