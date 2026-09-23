import { findGroupSignupField, type SignupField } from './signupFields';
import { prizeTargetTypes, type PrizeTargetType, type SignupRecord } from './related';

export function visiblePrizeTargetTypes(groupsEnabled: boolean): PrizeTargetType[] {
  if (groupsEnabled) return [...prizeTargetTypes];
  return prizeTargetTypes.filter((item) => item !== '指定分组');
}

export function signupGroupNames(fields: SignupField[] | undefined): string[] {
  return (findGroupSignupField(fields ?? [])?.groups ?? []).map((item) => item.name.trim()).filter(Boolean);
}

export function signupPickedGroups(answers?: Record<string, string>): string[] {
  return (answers?.['分组选择'] ?? '')
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function approvedSignupsInGroup(signups: SignupRecord[], groupName: string): SignupRecord[] {
  return signups.filter(
    (item) => item.status === '已通过' && signupPickedGroups(item.answers).includes(groupName),
  );
}
