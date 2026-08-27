import { describe, expect, it } from 'vitest';
import {
  defaultInterestGroupSettings,
  employeeCreatedActivityAuditStatus,
  employeeCreatedGroupAuditStatus,
  normalizeInterestGroupSettings,
} from './interestGroupSettings';

describe('interest group settings', () => {
  it('defaults to enabling all create and audit rules', () => {
    expect(defaultInterestGroupSettings).toEqual({
      allowEmployeeCreateGroup: true,
      allowMemberCreateActivity: true,
      employeeCreateGroupNeedAudit: true,
      employeeCreateActivityNeedAudit: true,
    });
    expect(normalizeInterestGroupSettings({})).toEqual(defaultInterestGroupSettings);
    expect(normalizeInterestGroupSettings({ allowEmployeeCreateGroup: false, employeeCreateGroupNeedAudit: false })).toEqual({
      allowEmployeeCreateGroup: false,
      allowMemberCreateActivity: true,
      employeeCreateGroupNeedAudit: false,
      employeeCreateActivityNeedAudit: true,
    });
    expect(employeeCreatedGroupAuditStatus(defaultInterestGroupSettings)).toBe('待审核');
    expect(
      employeeCreatedActivityAuditStatus({ ...defaultInterestGroupSettings, employeeCreateActivityNeedAudit: false }),
    ).toBe('无需审核');
  });
});
