import { describe, expect, it } from 'vitest';
import {
  canMemberCreateInterestGroupActivity,
  defaultInterestGroupSettings,
  employeeCreatedGroupAuditStatus,
  normalizeInterestGroupSettings,
} from './interestGroupSettings';

describe('interest group settings', () => {
  it('defaults to enabling group create and audit rules', () => {
    expect(defaultInterestGroupSettings).toEqual({
      allowEmployeeCreateGroup: true,
      employeeCreateGroupNeedAudit: true,
      activityCreator: 'member',
    });
    expect(normalizeInterestGroupSettings({})).toEqual(defaultInterestGroupSettings);
    expect(
      normalizeInterestGroupSettings({
        allowEmployeeCreateGroup: false,
        employeeCreateGroupNeedAudit: true,
        activityCreator: 'lead',
      }),
    ).toEqual({
      allowEmployeeCreateGroup: false,
      employeeCreateGroupNeedAudit: false,
      activityCreator: 'lead',
    });
    expect(employeeCreatedGroupAuditStatus(defaultInterestGroupSettings)).toBe('待审核');
    expect(employeeCreatedGroupAuditStatus({ ...defaultInterestGroupSettings, employeeCreateGroupNeedAudit: false })).toBe(
      '无需审核',
    );
  });

  it('lets members create activities only when activityCreator is member', () => {
    expect(canMemberCreateInterestGroupActivity({ activityCreator: 'member' }, 'lead')).toBe(true);
    expect(canMemberCreateInterestGroupActivity({ activityCreator: 'member' }, 'member')).toBe(true);
    expect(canMemberCreateInterestGroupActivity({ activityCreator: 'lead' }, 'lead')).toBe(true);
    expect(canMemberCreateInterestGroupActivity({ activityCreator: 'lead' }, 'member')).toBe(false);
    expect(canMemberCreateInterestGroupActivity({ activityCreator: 'lead' }, undefined)).toBe(false);
  });
});
