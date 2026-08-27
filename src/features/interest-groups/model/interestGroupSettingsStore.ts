import { useEffect, useState } from 'react';
import {
  INTEREST_GROUP_SETTINGS_MOCK_VERSION,
  cloneInterestGroupSettings,
  defaultInterestGroupSettings,
  type InterestGroupSettings,
} from './interestGroupSettings';

let mockVersion = INTEREST_GROUP_SETTINGS_MOCK_VERSION;
let settings = cloneInterestGroupSettings(defaultInterestGroupSettings);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === INTEREST_GROUP_SETTINGS_MOCK_VERSION) return;
  settings = cloneInterestGroupSettings(defaultInterestGroupSettings);
  mockVersion = INTEREST_GROUP_SETTINGS_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./interestGroupSettings', (mod) => {
    if (!mod) return;
    settings = cloneInterestGroupSettings(mod.defaultInterestGroupSettings);
    mockVersion = mod.INTEREST_GROUP_SETTINGS_MOCK_VERSION;
    emit();
  });
}

export function getInterestGroupSettings(): InterestGroupSettings {
  syncMockData();
  return cloneInterestGroupSettings(settings);
}

export function saveInterestGroupSettings(next: InterestGroupSettings) {
  settings = cloneInterestGroupSettings(next);
  emit();
}

export function useInterestGroupSettings() {
  const [value, setValue] = useState<InterestGroupSettings>(() => getInterestGroupSettings());
  useEffect(() => {
    syncMockData();
    setValue(getInterestGroupSettings());
    const onChange = () => setValue(getInterestGroupSettings());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return value;
}
