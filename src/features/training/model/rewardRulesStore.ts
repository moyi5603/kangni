import { useEffect, useState } from 'react';
import {
  cloneRewardRules,
  initialRewardRules,
  REWARD_RULES_MOCK_VERSION,
  type TrainingRewardRules,
} from './rewardRules';

let mockVersion = REWARD_RULES_MOCK_VERSION;
let rules = cloneRewardRules(initialRewardRules);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === REWARD_RULES_MOCK_VERSION) return;
  rules = cloneRewardRules(initialRewardRules);
  mockVersion = REWARD_RULES_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./rewardRules', (mod) => {
    if (!mod) return;
    rules = cloneRewardRules(mod.initialRewardRules);
    mockVersion = mod.REWARD_RULES_MOCK_VERSION;
    emit();
  });
}

export function getRewardRules(): TrainingRewardRules {
  syncMockData();
  return cloneRewardRules(rules);
}

export function saveRewardRules(next: TrainingRewardRules) {
  rules = cloneRewardRules(next);
  emit();
}

export function useRewardRules() {
  const [value, setValue] = useState<TrainingRewardRules>(() => getRewardRules());
  useEffect(() => {
    syncMockData();
    setValue(getRewardRules());
    const onChange = () => setValue(getRewardRules());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return value;
}
