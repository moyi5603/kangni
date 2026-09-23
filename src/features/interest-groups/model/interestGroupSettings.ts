export const INTEREST_GROUP_SETTINGS_MOCK_VERSION = 7;

export type InterestGroupActivityCreator = 'lead' | 'member';

export type InterestGroupSettings = {
  allowEmployeeCreateGroup: boolean;
  employeeCreateGroupNeedAudit: boolean;
  activityCreator: InterestGroupActivityCreator;
};

export const defaultInterestGroupSettings: InterestGroupSettings = {
  allowEmployeeCreateGroup: true,
  employeeCreateGroupNeedAudit: true,
  activityCreator: 'member',
};

export function normalizeInterestGroupSettings(value: Partial<InterestGroupSettings> | undefined): InterestGroupSettings {
  const activityCreator = value?.activityCreator === 'lead' ? 'lead' : defaultInterestGroupSettings.activityCreator;
  const allowEmployeeCreateGroup = value?.allowEmployeeCreateGroup ?? defaultInterestGroupSettings.allowEmployeeCreateGroup;
  return {
    allowEmployeeCreateGroup,
    employeeCreateGroupNeedAudit: allowEmployeeCreateGroup
      ? (value?.employeeCreateGroupNeedAudit ?? defaultInterestGroupSettings.employeeCreateGroupNeedAudit)
      : false,
    activityCreator,
  };
}

export function cloneInterestGroupSettings(value: Partial<InterestGroupSettings> | undefined): InterestGroupSettings {
  return normalizeInterestGroupSettings(value);
}

export function employeeCreatedGroupAuditStatus(
  settings: InterestGroupSettings,
): '待审核' | '无需审核' {
  if (!settings.allowEmployeeCreateGroup) return '无需审核';
  return settings.employeeCreateGroupNeedAudit ? '待审核' : '无需审核';
}

export function canMemberCreateInterestGroupActivity(
  settings: Pick<InterestGroupSettings, 'activityCreator'>,
  role: 'lead' | 'member' | undefined,
): boolean {
  if (role === 'lead') return true;
  if (role === 'member') return settings.activityCreator === 'member';
  return false;
}
