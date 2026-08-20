import { describe, expect, it } from 'vitest';
import { employeeAvatarColor, employeeAvatarLetter } from './employeeAvatar';

describe('employee avatar', () => {
  it('uses the last character and maps blank names to ?', () => {
    expect(employeeAvatarLetter('张悦')).toBe('悦');
    expect(employeeAvatarLetter('  ')).toBe('?');
    expect(employeeAvatarLetter('')).toBe('?');
  });

  it('keeps the same color for the same name', () => {
    expect(employeeAvatarColor('张悦')).toBe(employeeAvatarColor('张悦'));
    expect(employeeAvatarColor('张悦')).toMatch(/^#/);
  });
});
