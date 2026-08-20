import { useEffect, useState } from 'react';
import { cloneRules, initialRules, RULES_MOCK_VERSION, type ActivityTypeRule } from './rules';

let mockVersion = RULES_MOCK_VERSION;
let rules = cloneRules(initialRules);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === RULES_MOCK_VERSION) return;
  rules = cloneRules(initialRules);
  mockVersion = RULES_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./rules', (mod) => {
    if (!mod) return;
    rules = cloneRules(mod.initialRules);
    mockVersion = mod.RULES_MOCK_VERSION;
    emit();
  });
}

export function getRules(): ActivityTypeRule[] {
  syncMockData();
  return cloneRules(rules);
}

export function saveRules(next: ActivityTypeRule[]) {
  rules = cloneRules(next);
  emit();
}

export function useRules() {
  const [list, setList] = useState<ActivityTypeRule[]>(() => getRules());
  useEffect(() => {
    syncMockData();
    setList(getRules());
    const onChange = () => setList(getRules());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
