import { describe, expect, it } from 'vitest';
import { firstVoteV2FormErrorTab, voteV2FormTabForFieldName } from './voteV2FormTabs';

describe('voteV2FormTabs', () => {
  it('maps root field names to form tabs', () => {
    expect(voteV2FormTabForFieldName('name')).toBe('basic');
    expect(voteV2FormTabForFieldName('coverUrl')).toBe('style');
    expect(voteV2FormTabForFieldName(['groups', 0, 'name'])).toBe('function');
    expect(voteV2FormTabForFieldName('departments')).toBe('function');
  });

  it('picks the earliest error field tab in validate order', () => {
    expect(
      firstVoteV2FormErrorTab([
        { name: 'coverUrl' },
        { name: 'name' },
      ]),
    ).toBe('style');
    expect(
      firstVoteV2FormErrorTab([
        { name: 'name' },
        { name: 'coverUrl' },
      ]),
    ).toBe('basic');
    expect(firstVoteV2FormErrorTab([])).toBeUndefined();
  });
});
