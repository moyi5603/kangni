import { useEffect, useState } from 'react';
import {
  ACTIVITY_POINT_RULES_MOCK_VERSION,
  cloneActivityPointRules,
  initialActivityPointRules,
  type ActivityPointRules,
} from '../../activities/model/activityPointRules';

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
  import.meta.hot.accept('../../activities/model/activityPointRules', (mod) => {
    if (!mod) return;
    rules = cloneActivityPointRules(mod.initialActivityPointRules);
    mockVersion = mod.ACTIVITY_POINT_RULES_MOCK_VERSION;
    emit();
  });
}

export function getInterestGroupPointRules(): ActivityPointRules {
  syncMockData();
  return cloneActivityPointRules(rules);
}

export function saveInterestGroupPointRules(next: ActivityPointRules) {
  rules = cloneActivityPointRules(next);
  emit();
}

export function useInterestGroupPointRules() {
  const [value, setValue] = useState<ActivityPointRules>(() => getInterestGroupPointRules());
  useEffect(() => {
    syncMockData();
    setValue(getInterestGroupPointRules());
    const onChange = () => setValue(getInterestGroupPointRules());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return value;
}
