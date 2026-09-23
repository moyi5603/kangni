import { afterEach, describe, expect, it } from 'vitest';
import { initialActivities } from './activity';
import { ensureOrganizerSignup, ensureOrganizerSignups } from './organizerSignup';
import { getRelatedList, restoreRelatedSignups } from './related';
import { patchActivities, upsertActivity } from './activityStore';

const openDay = initialActivities.find((item) => item.id === 1)!;
const fireDrill = initialActivities.find((item) => item.id === 12)!;
const basketball = initialActivities.find((item) => item.id === 26)!;

describe('organizer auto signup', () => {
  afterEach(() => {
    restoreRelatedSignups();
    patchActivities((list) => list.filter((item) => item.id !== 9801));
  });

  it('keeps an existing approved organizer signup', () => {
    const before = getRelatedList('signups').filter((item) => item.activityId === 1 && item.name === '陈产品');
    expect(before).toHaveLength(1);
    expect(ensureOrganizerSignup(openDay)?.id).toBe(before[0].id);
    expect(getRelatedList('signups').filter((item) => item.activityId === 1 && item.name === '陈产品')).toHaveLength(1);
  });

  it('locks a series organizer onto every session without dropping other answers', () => {
    const camp = initialActivities.find((item) => item.id === 2)!;
    ensureOrganizerSignup(camp);
    const rows = getRelatedList('signups').filter((item) => item.activityId === 2 && item.name === '陈产品' && item.status === '已通过');
    expect(rows.map((item) => item.answers?.['场次']).sort()).toEqual(['onboard-1', 'onboard-2', 'onboard-3']);
    expect(rows.every((item) => item.answers?.['分组选择'] === '技术组')).toBe(true);
    ensureOrganizerSignup(camp);
    expect(getRelatedList('signups').filter((item) => item.activityId === 2 && item.name === '陈产品' && item.status === '已通过')).toHaveLength(3);
  });

  it('expands a partial series organizer pick to every session', () => {
    const workshop = initialActivities.find((item) => item.id === 27)!;
    ensureOrganizerSignup(workshop);
    const rows = getRelatedList('signups').filter((item) => item.activityId === 27 && item.name === '陈产品');
    expect(rows.map((item) => item.answers?.['场次']).sort()).toEqual(['s-0-202609050900', 's-1-202609120900']);
  });

  it('promotes a rejected organizer signup to approved', () => {
    const row = ensureOrganizerSignup(fireDrill);
    expect(row?.status).toBe('已通过');
    expect(row?.name).toBe('陈产品');
    expect(row?.phone).toBe('13800001111');
    expect(getRelatedList('signups').filter((item) => item.activityId === 12 && item.name === '陈产品')).toHaveLength(1);
  });

  it('adds the organizer when they are not on the list', () => {
    const seeded = getRelatedList('signups').some((item) => item.activityId === 26 && item.name === '张悦');
    expect(seeded).toBe(true);
    const row = ensureOrganizerSignup(basketball);
    expect(row).toMatchObject({
      activityId: 26,
      name: '张悦',
      phone: '13800001001',
      status: '已通过',
      signupType: '个人报名',
    });
    expect(getRelatedList('signups').some((item) => item.activityId === 26 && item.name === '陈产品')).toBe(true);
    expect(row?.answers?.['场次']).toBe(basketball.sessions[0]?.id);
    expect(
      getRelatedList('signups')
        .filter((item) => item.activityId === 26 && item.name === '张悦' && item.status === '已通过')
        .map((item) => item.answers?.['场次'])
        .sort(),
    ).toEqual([...basketball.sessions.map((item) => item.id)].sort());
  });

  it('fills missing organizers for published activities and stays idempotent', () => {
    ensureOrganizerSignups(initialActivities);
    const first = getRelatedList('signups').filter((item) => item.name === '陈产品' && item.status === '已通过');
    expect(first.length).toBeGreaterThan(8);
    expect(first.some((item) => item.activityId === 21)).toBe(true);
    ensureOrganizerSignups(initialActivities);
    const second = getRelatedList('signups').filter((item) => item.name === '陈产品' && item.status === '已通过');
    expect(second).toHaveLength(first.length);
  });

  it('writes an organizer signup when an activity is saved', () => {
    const created = {
      ...openDay,
      id: 9801,
      title: '发起人自动报名验收',
      organizer: '张悦',
      phone: '13800001001',
    };
    upsertActivity(created);
    const row = getRelatedList('signups').find((item) => item.activityId === 9801 && item.name === '张悦');
    expect(row?.status).toBe('已通过');
    expect(row?.department).toBe('前端组');
  });
});
