import { describe, expect, it } from 'vitest';
import { addSignupField, defaultSignupFields, setSignupFieldCompanion, setSignupFieldGroups, stringifyCompanionPeople } from './signupFields';
import { formatSignupAnswersSummary, formatSignupAnswerValue, resolveSignupRecordAnswers } from './signupAnswers';

describe('signupAnswers', () => {
  it('merges record columns into answers', () => {
    expect(
      resolveSignupRecordAnswers({
        name: '陈产品',
        phone: '13800001111',
        department: '职能中心',
        answers: { 岗位: '产品经理' },
      }),
    ).toMatchObject({
      姓名: '陈产品',
      手机号: '13800001111',
      部门: '职能中心',
      岗位: '产品经理',
    });
  });

  it('formats companion json for display', () => {
    const fields = setSignupFieldCompanion(addSignupField(defaultSignupFields(), '同行人'), '同行人', 1, ['姓名', '手机号']);
    const field = fields.find((item) => item.key === '同行人')!;
    const raw = stringifyCompanionPeople([{ 姓名: '张三', 手机号: '13900001111' }]);
    expect(formatSignupAnswerValue(field, raw)).toBe('同行人1（姓名：张三，手机号：13900001111）');
  });

  it('builds a short summary with ellipsis when truncated', () => {
    const fields = addSignupField(addSignupField(addSignupField(defaultSignupFields(), '邮箱'), '性别'), '年龄');
    const answers = { 邮箱: 'a@b.com', 性别: '男', 年龄: '30' };
    expect(formatSignupAnswersSummary(fields, answers, 2)).toBe('邮箱：a@b.com；性别：男…');
  });

  it('formats group selection value', () => {
    let fields = addSignupField(defaultSignupFields(), '分组选择');
    fields = setSignupFieldGroups(fields, '分组选择', [
      { name: '技术组', limit: 30 },
      { name: '业务组', limit: 20 },
    ]);
    const field = fields.find((item) => item.key === '分组选择')!;
    expect(formatSignupAnswerValue(field, '技术组')).toBe('技术组');
  });
});
