import { useEffect, useState } from 'react';
import {
  ACTIVITY_POINT_RULES_MOCK_VERSION,
  cloneActivityPointRules,
  initialActivityPointRules,
  type ActivityPointRules,
} from './activityPointRules';

let mockVersion = ACTIVITY_POINT_RULES_MOCK_VERSION;
let rules = cloneActivityPointRules(initialActivityPointRules);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === ACTIVITY_POINT_RULES_MOCK_VERSION) return;
  rules = cloneActivityPointRules(initialActivityPointRules);
  mockVersion = ACTIVITY_POINT_RULES_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./activityPointRules', (mod) => {
    if (!mod) return;
    rules = cloneActivityPointRules(mod.initialActivityPointRules);
    mockVersion = mod.ACTIVITY_POINT_RULES_MOCK_VERSION;
    emit();
  });
}

export function getActivityPointRules(): ActivityPointRules {
  syncMockData();
  return cloneActivityPointRules(rules);
}

export function saveActivityPointRules(next: ActivityPointRules) {
  rules = cloneActivityPointRules(next);
  emit();
}

export function useActivityPointRules() {
  const [value, setValue] = useState<ActivityPointRules>(() => getActivityPointRules());
  useEffect(() => {
    syncMockData();
    setValue(getActivityPointRules());
    const onChange = () => setValue(getActivityPointRules());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return value;
}
