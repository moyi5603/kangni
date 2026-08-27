import { describe, expect, it } from 'vitest';
import { activityTypes } from './activity';
import {
  canDisableCreate,
  emptyRule,
  firstCreatableType,
  formatApprovalNodeSummary,
  listCreatableTypeOptions,
  prepareRulesForSave,
  formatSignupAuditSummary,
  type ActivityTypeRule,
} from './rules';

function rulesWith(enabled: Partial<Record<(typeof activityTypes)[number], boolean>>): ActivityTypeRule[] {
  return activityTypes.map((type) => ({
    ...emptyRule(type),
    createEnabled: enabled[type] ?? true,
  }));
}

describe('createEnabled helpers', () => {
  it('lists all types when every createEnabled is on', () => {
    const options = listCreatableTypeOptions(rulesWith({}));
    expect(options).toEqual(activityTypes.map((type) => ({ value: type, label: type })));
    expect(firstCreatableType(rulesWith({}))).toBe('公司活动');
  });

  it('hides disabled types on create and keeps a disabled current type on edit', () => {
    const rules = rulesWith({ 项目活动: false });
    expect(listCreatableTypeOptions(rules).map((item) => item.value)).toEqual(['公司活动', '疗休养活动', '体检活动']);
    expect(listCreatableTypeOptions(rules, '项目活动')).toEqual([
      { value: '公司活动', label: '公司活动' },
      { value: '疗休养活动', label: '疗休养活动' },
      { value: '体检活动', label: '体检活动' },
      { value: '项目活动', label: '项目活动', disabled: true },
    ]);
  });

  it('treats missing createEnabled as true and rejects turning off the last type', () => {
    const legacy = activityTypes.map((type) => {
      const rule = emptyRule(type);
      delete (rule as { createEnabled?: boolean }).createEnabled;
      return rule;
    });
    expect(listCreatableTypeOptions(legacy)).toHaveLength(4);
    expect(prepareRulesForSave(legacy).every((item) => item.createEnabled === true)).toBe(true);

    const allOff = rulesWith({
      公司活动: false,
      疗休养活动: false,
      体检活动: false,
      项目活动: false,
    });
    expect(listCreatableTypeOptions(allOff)).toEqual([]);
    expect(firstCreatableType(allOff)).toBeUndefined();

    const onlyCompany = rulesWith({
      疗休养活动: false,
      体检活动: false,
      项目活动: false,
    });
    expect(canDisableCreate(onlyCompany, '公司活动')).toBe(false);
    expect(canDisableCreate(onlyCompany, '项目活动')).toBe(true);
  });

  it('allows turning off one type when two remain open', () => {
    const twoOpen = rulesWith({
      体检活动: false,
      项目活动: false,
    });
    expect(canDisableCreate(twoOpen, '公司活动')).toBe(true);
    expect(canDisableCreate(twoOpen, '疗休养活动')).toBe(true);
  });
});

describe('formatApprovalNodeSummary', () => {
  it('shows named reviewers for 指定审核人', () => {
    expect(
      formatApprovalNodeSummary({ id: '1', assigneeMode: 'people', reviewerIds: ['张悦', '李明'] }),
    ).toBe('指定审核人（张悦、李明）');
  });

  it('shows role labels without extra picker text', () => {
    expect(
      formatApprovalNodeSummary({ id: '2', assigneeMode: 'sameLevelLeader', reviewerIds: [] }),
    ).toBe('本级部门负责人');
    expect(
      formatApprovalNodeSummary({ id: '3', assigneeMode: 'parentLevelLeader', reviewerIds: [] }),
    ).toBe('上级部门负责人');
  });
});

describe('formatSignupAuditSummary', () => {
  it('uses one label for off, admin, and node flow', () => {
    expect(formatSignupAuditSummary(false, [])).toBe('无需审核');
    expect(formatSignupAuditSummary(true, [])).toBe('需要审核');
    expect(
      formatSignupAuditSummary(true, [{ id: '1', assigneeMode: 'sameLevelLeader', reviewerIds: [] }]),
    ).toBe('需要审核；第 1 节点：本级部门负责人');
  });
});
