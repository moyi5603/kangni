export const INTEREST_GROUP_SETTINGS_MOCK_VERSION = 5;

export type InterestGroupSettings = {
  allowEmployeeCreateGroup: boolean;
  employeeCreateGroupNeedAudit: boolean;
};

export const defaultInterestGroupSettings: InterestGroupSettings = {
  allowEmployeeCreateGroup: true,
  employeeCreateGroupNeedAudit: true,
};

export function normalizeInterestGroupSettings(value: Partial<InterestGroupSettings> | undefined): InterestGroupSettings {
  return {
    allowEmployeeCreateGroup: value?.allowEmployeeCreateGroup ?? defaultInterestGroupSettings.allowEmployeeCreateGroup,
    employeeCreateGroupNeedAudit:
      value?.employeeCreateGroupNeedAudit ?? defaultInterestGroupSettings.employeeCreateGroupNeedAudit,
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
