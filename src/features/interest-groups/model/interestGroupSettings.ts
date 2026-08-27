export const INTEREST_GROUP_SETTINGS_MOCK_VERSION = 4;

export type InterestGroupSettings = {
  allowEmployeeCreateGroup: boolean;
  allowMemberCreateActivity: boolean;
  employeeCreateGroupNeedAudit: boolean;
  employeeCreateActivityNeedAudit: boolean;
};

export const defaultInterestGroupSettings: InterestGroupSettings = {
  allowEmployeeCreateGroup: true,
  allowMemberCreateActivity: true,
  employeeCreateGroupNeedAudit: true,
  employeeCreateActivityNeedAudit: true,
};

export function normalizeInterestGroupSettings(value: Partial<InterestGroupSettings> | undefined): InterestGroupSettings {
  return {
    allowEmployeeCreateGroup: value?.allowEmployeeCreateGroup ?? defaultInterestGroupSettings.allowEmployeeCreateGroup,
    allowMemberCreateActivity: value?.allowMemberCreateActivity ?? defaultInterestGroupSettings.allowMemberCreateActivity,
    employeeCreateGroupNeedAudit:
      value?.employeeCreateGroupNeedAudit ?? defaultInterestGroupSettings.employeeCreateGroupNeedAudit,
    employeeCreateActivityNeedAudit:
      value?.employeeCreateActivityNeedAudit ?? defaultInterestGroupSettings.employeeCreateActivityNeedAudit,
  };
}

export function cloneInterestGroupSettings(value: Partial<InterestGroupSettings> | undefined): InterestGroupSettings {
  return normalizeInterestGroupSettings(value);
}

export function employeeCreatedGroupAuditStatus(
  settings: InterestGroupSettings,
): '待审核' | '无需审核' {
  return settings.employeeCreateGroupNeedAudit ? '待审核' : '无需审核';
}

export function employeeCreatedActivityAuditStatus(
  settings: InterestGroupSettings,
): '待审核' | '无需审核' {
  return settings.employeeCreateActivityNeedAudit ? '待审核' : '无需审核';
}
