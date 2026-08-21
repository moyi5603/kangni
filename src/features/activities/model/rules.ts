import { activityTypes, type ActivityType } from './activity';

export const RULES_MOCK_VERSION = 2;

export type AssigneeMode = 'people' | 'department';

export type SignupLadder = {
  minSeniorityYears: number;
  annualQuota: number;
};

export type ApprovalNode = {
  id: string;
  assigneeMode: AssigneeMode;
  reviewerIds: string[];
  departmentId?: string;
};

export type ActivityTypeRule = {
  type: ActivityType;
  createEnabled: boolean;
  signupLadders: SignupLadder[];
  momentAuditEnabled: boolean;
  approvalEnabled: boolean;
  approvalNodes: ApprovalNode[];
};

export function emptyRule(type: ActivityType): ActivityTypeRule {
  return {
    type,
    createEnabled: true,
    signupLadders: [],
    momentAuditEnabled: false,
    approvalEnabled: false,
    approvalNodes: [],
  };
}

export type TypeRadioOption = {
  value: ActivityType;
  label: ActivityType;
  disabled?: boolean;
};

export function isCreateEnabled(rule: ActivityTypeRule | undefined): boolean {
  return rule?.createEnabled !== false;
}

export function listCreatableTypeOptions(rules: ActivityTypeRule[], currentType?: ActivityType): TypeRadioOption[] {
  return activityTypes.flatMap((type) => {
    const enabled = isCreateEnabled(rules.find((item) => item.type === type));
    if (enabled) return [{ value: type, label: type }];
    if (currentType === type) return [{ value: type, label: type, disabled: true }];
    return [];
  });
}

export function firstCreatableType(rules: ActivityTypeRule[]): ActivityType | undefined {
  return activityTypes.find((type) => isCreateEnabled(rules.find((item) => item.type === type)));
}

export function canDisableCreate(rules: ActivityTypeRule[], type: ActivityType): boolean {
  const enabledTypes = activityTypes.filter((item) => isCreateEnabled(rules.find((rule) => rule.type === item)));
  if (enabledTypes.length > 1) return true;
  return enabledTypes[0] !== type;
}

export function emptyLadder(): Partial<SignupLadder> {
  return {};
}

export function createApprovalNode(): ApprovalNode {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    assigneeMode: 'people',
    reviewerIds: [],
  };
}

export function matchSignupLadder(ladders: SignupLadder[], seniorityYears: number): SignupLadder | undefined {
  const eligible = ladders.filter((item) => item.minSeniorityYears <= seniorityYears);
  if (!eligible.length) return undefined;
  return eligible.reduce((best, item) => (item.minSeniorityYears >= best.minSeniorityYears ? item : best));
}

export function sortLadders(ladders: SignupLadder[]): SignupLadder[] {
  return [...ladders].sort((a, b) => a.minSeniorityYears - b.minSeniorityYears);
}

export function duplicateYearIndexes(ladders: { minSeniorityYears?: number }[]): number[] {
  const seen = new Map<number, number>();
  const dupes: number[] = [];
  ladders.forEach((item, index) => {
    const year = item.minSeniorityYears;
    if (year == null || Number.isNaN(Number(year))) return;
    if (seen.has(year)) dupes.push(index);
    else seen.set(year, index);
  });
  return dupes;
}

export function prepareRulesForSave(rules: ActivityTypeRule[]): ActivityTypeRule[] {
  return activityTypes.map((type) => {
    const current = rules.find((item) => item.type === type) ?? emptyRule(type);
    return {
      ...current,
      type,
      createEnabled: current.createEnabled !== false,
      signupLadders: sortLadders(current.signupLadders ?? []),
      approvalNodes: current.approvalEnabled ? current.approvalNodes ?? [] : [],
    };
  });
}

export function cloneRules(rules: ActivityTypeRule[]): ActivityTypeRule[] {
  return rules.map((item) => ({
    ...item,
    signupLadders: item.signupLadders.map((ladder) => ({ ...ladder })),
    approvalNodes: item.approvalNodes.map((node) => ({ ...node, reviewerIds: [...node.reviewerIds] })),
  }));
}

export const initialRules: ActivityTypeRule[] = activityTypes.map((type) => {
  if (type === '疗休养活动') {
    return {
      ...emptyRule(type),
      signupLadders: [
        { minSeniorityYears: 1, annualQuota: 1 },
        { minSeniorityYears: 3, annualQuota: 2 },
      ],
    };
  }
  if (type === '公司活动') {
    return {
      ...emptyRule(type),
      momentAuditEnabled: true,
      approvalEnabled: true,
      approvalNodes: [
        { id: 'company-1', assigneeMode: 'people', reviewerIds: ['张悦', '李明'] },
        { id: 'company-2', assigneeMode: 'department', reviewerIds: [], departmentId: '人力资源' },
      ],
    };
  }
  return emptyRule(type);
});
