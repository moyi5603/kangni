import { describe, expect, it } from 'vitest';
import { shouldShowMomentsTab } from './activitySocialTabs';

describe('shouldShowMomentsTab', () => {
  it('shows when there are moments or the viewer can submit', () => {
    expect(shouldShowMomentsTab(1, false)).toBe(true);
    expect(shouldShowMomentsTab(0, true)).toBe(true);
    expect(shouldShowMomentsTab(2, true)).toBe(true);
  });

  it('hides when empty and the viewer cannot submit', () => {
    expect(shouldShowMomentsTab(0, false)).toBe(false);
  });
});
