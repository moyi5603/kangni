import { describe, expect, it } from 'vitest';
import { filterShareContacts, listShareContacts, shareConfirmMessage } from './activityShare';

describe('activity share contacts', () => {
  it('lists org people except the current user', () => {
    const people = listShareContacts('13800001111');
    expect(people.some((item) => item.phone === '13800001111')).toBe(false);
    expect(people.some((item) => item.name === '张悦')).toBe(true);
    expect(people.length).toBeGreaterThan(5);
  });

  it('filters contacts by name or department', () => {
    const people = listShareContacts('13800001111');
    expect(filterShareContacts(people, '张').map((item) => item.name)).toEqual(['张悦']);
    expect(filterShareContacts(people, '前端组').every((item) => item.department === '前端组')).toBe(true);
  });

  it('builds the mock send toast', () => {
    expect(shareConfirmMessage(3)).toBe('已分享给 3 人');
  });
});
