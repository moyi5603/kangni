import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getActivity } from '../../../activities/model/activityStore';
import { getRelatedList, patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import {
  DEMO_SIGNUP_USER,
  getUserSignups,
  loadDemoSignups,
  resetClientSignups,
  submitSignup,
  cancelSignup,
} from './signupStore';

describe('signup store', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });

  it('protects stored records from mutations to returned records', () => {
    expect(submitSignup(9001, '个人报名')).toBe('ok');
    const first = getUserSignups();
    const stored = { ...first.find((signup) => signup.activityId === 9001)! };

    first.find((signup) => signup.activityId === 9001)!.name = '被篡改';
    first.find((signup) => signup.activityId === 9001)!.type = '被篡改';
    first.find((signup) => signup.activityId === 9001)!.createdAt = '2000-01-01';

    expect(getUserSignups().find((signup) => signup.activityId === 9001)).toEqual(stored);
  });

  it('stores signup time as a local wall-clock timestamp', () => {
    expect(submitSignup(9002, '个人报名')).toBe('ok');

    const signup = getUserSignups(DEMO_SIGNUP_USER.phone).find(({ activityId }) => activityId === 9002);

    expect(signup?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('still rejects duplicate signups for one activity', () => {
    expect(submitSignup(9003, '个人报名')).toBe('ok');
    expect(submitSignup(9003, '个人报名')).toBe('duplicate');
  });

  it('writes new signups as approved', () => {
    expect(submitSignup(9004, '个人报名')).toBe('ok');
    expect(getUserSignups().find((signup) => signup.activityId === 9004)?.status).toBe('已通过');
  });

  it('writes editable profile fields from the signup answers', () => {
    expect(
      submitSignup(9004, '个人报名', {
        姓名: '陈改名',
        手机号: '13900000000',
        部门: '研发中心',
        岗位: '产品经理',
      }),
    ).toBe('ok');
    const row = getRelatedList('signups').find((item) => item.activityId === 9004 && item.accountPhone === DEMO_SIGNUP_USER.phone);
    expect(row).toMatchObject({
      name: '陈改名',
      phone: '13900000000',
      department: '研发中心',
      answers: { 岗位: '产品经理' },
    });
    expect(getUserSignups().some((item) => item.activityId === 9004)).toBe(true);
  });

  it('writes into related.signups so admin lists can see the row', () => {
    expect(submitSignup(9005, '个人报名')).toBe('ok');
    const row = getRelatedList('signups').find(
      (item) => item.activityId === 9005 && item.phone === DEMO_SIGNUP_USER.phone,
    );
    expect(row).toMatchObject({
      name: DEMO_SIGNUP_USER.name,
      signupType: '个人报名',
      department: '职能中心',
      status: '已通过',
    });
  });

  it('uses needAudit from the activity signup setting', () => {
    expect(getActivity(2)?.signupSettings).toEqual([{ type: '个人报名', limit: 60, needAudit: true }]);
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(getUserSignups().find((item) => item.activityId === 2)?.status).toBe('待审核');
    resetClientSignups();
    expect(getActivity(6)?.signupSettings.some((item) => item.needAudit === false)).toBe(true);
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(getUserSignups().find((item) => item.activityId === 6)?.status).toBe('已通过');
  });

  it('hides cancelled rows and allows signing up again', () => {
    expect(submitSignup(9006, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 9006 && item.phone === DEMO_SIGNUP_USER.phone
          ? { ...item, status: '已取消' }
          : item,
      ),
    );
    expect(getUserSignups().some((item) => item.activityId === 9006)).toBe(false);
    expect(submitSignup(9006, '个人报名')).toBe('ok');
  });

  it('cancels before the signup deadline and frees the seat', () => {
    loadDemoSignups();
    expect(cancelSignup(2, Date.parse('2026-08-21T12:00:00'))).toBe('ok');
    expect(getUserSignups().some((item) => item.activityId === 2)).toBe(false);
    expect(getRelatedList('signups').find((item) => item.id === 4)?.status).toBe('已取消');
    expect(submitSignup(2, '个人报名')).toBe('ok');
  });

  it('refuses cancel after the signup deadline', () => {
    loadDemoSignups();
    expect(cancelSignup(2, Date.parse('2026-09-01T12:00:00'))).toBe('closed');
    expect(getUserSignups().some((item) => item.activityId === 2)).toBe(true);
  });

  it('reflects admin status patches on the client list', () => {
    loadDemoSignups();
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 6 && item.phone === DEMO_SIGNUP_USER.phone
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    expect(getUserSignups().find((item) => item.activityId === 6)?.status).toBe('已通过');
  });

  it('does not delete other people when resetting the demo user', () => {
    loadDemoSignups();
    resetClientSignups();
    expect(getUserSignups()).toEqual([]);
    expect(getRelatedList('signups').some((item) => item.phone === '13800001001')).toBe(true);
  });

  it('loads demo records covering activity and audit mixes', () => {
    loadDemoSignups();
    const list = getUserSignups();
    const byId = Object.fromEntries(list.map((signup) => [signup.activityId, signup]));

    expect(list).toHaveLength(5);
    expect(byId[2]?.status).toBe('已通过');
    expect(byId[6]?.status).toBe('已通过');
    expect(byId[9]?.status).toBe('已通过');
    expect(byId[1]?.status).toBe('已通过');
    expect(byId[12]?.status).toBe('已驳回');
    expect(byId[3]).toBeUndefined();
    expect(byId[2]!.createdAt > byId[6]!.createdAt).toBe(true);
    expect(byId[6]!.createdAt > byId[9]!.createdAt).toBe(true);
  });

  it('keeps reset as a wipe, not a seed restore', () => {
    loadDemoSignups();
    resetClientSignups();
    expect(getUserSignups()).toEqual([]);
  });
});
