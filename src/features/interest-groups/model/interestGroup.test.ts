import { describe, expect, it } from 'vitest';
import { validateInterestGroupForm, type InterestGroupFormValues } from './interestGroup';

const base: InterestGroupFormValues = {
  name: '测试小组',
  categoryKey: 'sport',
  leadEmployeeId: '',
  joinMode: 'free',
  area: '',
  tags: [],
  intro: '',
  coverUrl: '/cover.jpg',
};

describe('validateInterestGroupForm', () => {
  it('asks for 小组负责人 instead of 组长', () => {
    expect(validateInterestGroupForm(base, false)).toBe('请选择小组负责人');
  });
});
