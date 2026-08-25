import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { ApprovedSignupPeople } from './ApprovedSignupPeople';

function seedApprovedPeople(activityId: number, count: number) {
  patchRelated('signups', (list) => [
    ...list,
    ...Array.from({ length: count }, (_, index) => ({
      id: 9100 + index,
      activityId,
      name: `同事${index + 1}`,
      phone: `1390000${String(index).padStart(4, '0')}`,
      signupType: '个人报名',
      department: index % 2 ? '研发中心' : '职能中心',
      status: '已通过' as const,
      createdAt: `2026-08-20 ${String(10 + index).padStart(2, '0')}:00:00`,
    })),
  ]);
}

describe('Approved signup people', () => {
  afterEach(() => {
    restoreRelatedSignups();
  });

  it('summarizes approved people instead of tiling the full list', () => {
    const html = renderToStaticMarkup(<ApprovedSignupPeople activityId={2} />);
    expect(html).toContain('已报名人员（50）');
    expect(html).toContain('+45');
    expect(html).toContain('查看名单');
    expect(html).toContain('c-avatar');
    expect(html).toContain('c-signup-people-trigger');
    expect(html).not.toContain('c-signup-people-list');
    expect(html).not.toContain('前端组');
    expect(html).not.toContain('职能中心');
    expect(html).not.toContain('王芳');
  });

  it('opens the full approved list in a panel', () => {
    const html = renderToStaticMarkup(<ApprovedSignupPeople activityId={2} open />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('c-signup-people-list is-cols-4');
    expect(html).toContain('张悦');
    expect(html).toContain('前端组');
    expect(html).toContain('陈产品');
    expect(html).toContain('职能中心');
    expect(html).toContain('周工');
    expect(html).toContain('总装车间');
    expect(html).toContain('赵人事');
    expect(html).toContain('人力资源');
    expect(html).not.toContain('王芳');
    expect(html).not.toContain('吴检');
  });

  it('shows leftover count on the avatar stack when many people are approved', () => {
    seedApprovedPeople(21, 8);
    const html = renderToStaticMarkup(<ApprovedSignupPeople activityId={21} />);
    expect(html).toContain('已报名人员（8）');
    expect(html).toContain('+3');
    expect(html).toContain('查看名单');
  });

  it('lets the panel filter a long list by name', () => {
    seedApprovedPeople(21, 8);
    const html = renderToStaticMarkup(<ApprovedSignupPeople activityId={21} open query="同事1" />);
    expect(html).toContain('placeholder="搜索姓名或部门"');
    expect(html).toContain('同事1');
    expect(html).not.toContain('同事2');
  });
});
