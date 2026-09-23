import { describe, expect, it } from 'vitest';
import { prizeTargetTypes } from './related';
import { approvedSignupsInGroup, signupGroupNames, signupPickedGroups, visiblePrizeTargetTypes } from './prizeGrant';

describe('prize grant by group', () => {
  it('shows 指定分组 only when activity groups are enabled', () => {
    expect(prizeTargetTypes).toContain('指定分组');
    expect(visiblePrizeTargetTypes(true)).toEqual(['全部报名人员', '指定分组', '指定人员', '批量导入']);
    expect(visiblePrizeTargetTypes(false)).toEqual(['全部报名人员', '指定人员', '批量导入']);
  });

  it('reads configured group names and matches signup answers including multi-select', () => {
    expect(
      signupGroupNames([
        { key: '姓名', label: '姓名', source: 'preset', inputType: 'text', required: true },
        {
          key: '分组选择',
          label: '分组选择',
          source: 'preset',
          inputType: 'group',
          required: false,
          groups: [
            { name: '技术组', limit: 36 },
            { name: '业务组', limit: 24 },
          ],
        },
      ]),
    ).toEqual(['技术组', '业务组']);
    expect(signupPickedGroups({ 分组选择: '技术组、业务组' })).toEqual(['技术组', '业务组']);
    const rows = [
      { status: '已通过' as const, answers: { 分组选择: '技术组' }, name: '甲', phone: '1', signupType: '个人报名', department: '研发', id: 1, activityId: 2, createdAt: '' },
      { status: '已通过' as const, answers: { 分组选择: '业务组' }, name: '乙', phone: '2', signupType: '个人报名', department: '研发', id: 2, activityId: 2, createdAt: '' },
      { status: '待审核' as const, answers: { 分组选择: '技术组' }, name: '丙', phone: '3', signupType: '个人报名', department: '研发', id: 3, activityId: 2, createdAt: '' },
    ];
    expect(approvedSignupsInGroup(rows, '技术组').map((item) => item.name)).toEqual(['甲']);
  });
});
