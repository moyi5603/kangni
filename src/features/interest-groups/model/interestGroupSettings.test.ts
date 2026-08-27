import { describe, expect, it } from 'vitest';
import {
  defaultInterestGroupSettings,
  employeeCreatedGroupAuditStatus,
  normalizeInterestGroupSettings,
} from './interestGroupSettings';

describe('interest group settings', () => {
  it('defaults to enabling group create and audit rules', () => {
    expect(defaultInterestGroupSettings).toEqual({
      allowEmployeeCreateGroup: true,
      employeeCreateGroupNeedAudit: true,
    });
    expect(normalizeInterestGroupSettings({})).toEqual(defaultInterestGroupSettings);
    expect(normalizeInterestGroupSettings({ allowEmployeeCreateGroup: false, employeeCreateGroupNeedAudit: false })).toEqual({
      allowEmployeeCreateGroup: false,
      employeeCreateGroupNeedAudit: false,
    });
    expect(employeeCreatedGroupAuditStatus(defaultInterestGroupSettings)).toBe('待审核');
    expect(employeeCreatedGroupAuditStatus({ ...defaultInterestGroupSettings, employeeCreateGroupNeedAudit: false })).toBe(
      '无需审核',
    );
  });
});
