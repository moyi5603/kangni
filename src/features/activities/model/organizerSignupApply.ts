import { orgPeopleByName, type Activity } from './activity';
import { needsSessionPick, parseSessionIds } from './activitySchedule';
import type { SignupRecord } from './related';

export function organizerSignupIdentity(activity: Pick<Activity, 'organizer' | 'phone'>): {
  name: string;
  phone: string;
  department: string;
} {
  const name = activity.organizer.trim();
  const person = orgPeopleByName[name];
  return {
    name,
    phone: person?.phone || activity.phone.trim(),
    department: person?.department ?? '',
  };
}

function nextSignupId(list: SignupRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

function sessionIdOf(item: SignupRecord): string | undefined {
  const ids = parseSessionIds(item.answers?.['场次']);
  return ids[0];
}

function sameAnswers(left?: Record<string, string>, right?: Record<string, string>): boolean {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

function applyOrganizerOnce(signups: SignupRecord[], activity: Activity, identity: ReturnType<typeof organizerSignupIdentity>): SignupRecord[] {
  const existing = signups.find((item) => item.activityId === activity.id && item.name === identity.name && item.status !== '已取消');
  const signupType = activity.signupSettings[0]?.type.trim() || '个人报名';
  const answers = existing?.answers;
  if (existing) {
    if (existing.status === '已通过') return signups;
    return signups.map((item) => (item.id === existing.id ? { ...item, status: '已通过', answers } : item));
  }
  return [
    {
      id: nextSignupId(signups),
      activityId: activity.id,
      name: identity.name,
      phone: identity.phone,
      signupType,
      department: identity.department,
      status: '已通过',
      createdAt: activity.publishedAt || activity.createdAt,
      accountPhone: identity.phone || undefined,
      answers,
    },
    ...signups,
  ];
}

export function applyOrganizerSignup(signups: SignupRecord[], activity: Activity): SignupRecord[] {
  const identity = organizerSignupIdentity(activity);
  if (!identity.name) return signups;
  if (!needsSessionPick(activity.scheduleType)) return applyOrganizerOnce(signups, activity, identity);
  const sessionIds = (activity.sessions ?? []).map((item) => item.id);
  if (!sessionIds.length) return applyOrganizerOnce(signups, activity, identity);

  const mine = signups.filter((item) => item.activityId === activity.id && item.name === identity.name && item.status !== '已取消');
  const rest = signups.filter((item) => !mine.some((row) => row.id === item.id));
  const bySession = new Map<string, SignupRecord>();
  mine.forEach((row) => {
    const sessionId = sessionIdOf(row);
    if (sessionId && !bySession.has(sessionId)) bySession.set(sessionId, row);
  });
  const template = { ...(mine[0]?.answers ?? {}) };
  delete template['场次'];
  const signupType = activity.signupSettings[0]?.type.trim() || '个人报名';
  let nextId = nextSignupId(signups);
  const rows: SignupRecord[] = [];
  let changed = mine.length !== sessionIds.length;
  sessionIds.forEach((sessionId) => {
    const existing = bySession.get(sessionId);
    const answers = { ...template, ...(existing?.answers ?? {}), 场次: sessionId };
    if (!existing) {
      changed = true;
      rows.push({
        id: nextId,
        activityId: activity.id,
        name: identity.name,
        phone: identity.phone,
        signupType,
        department: identity.department,
        status: '已通过',
        createdAt: activity.publishedAt || activity.createdAt,
        accountPhone: identity.phone || undefined,
        answers,
      });
      nextId += 1;
      return;
    }
    if (existing.status !== '已通过' || !sameAnswers(existing.answers, answers)) {
      changed = true;
      rows.push({ ...existing, status: '已通过', answers });
      return;
    }
    rows.push(existing);
  });
  if (!changed) return signups;
  return [...rows, ...rest];
}

export function applyOrganizerSignups(signups: SignupRecord[], activities: readonly Activity[]): SignupRecord[] {
  return activities.reduce((list, activity) => applyOrganizerSignup(list, activity), signups);
}
