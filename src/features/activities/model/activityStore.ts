import { useEffect, useState } from 'react';
import { ACTIVITY_MOCK_VERSION, activityReviewer, canSubmitApproval, initialActivities, type Activity, type AuditStatus } from './activity';
import { recordApprovalDecision, recordApprovalSubmit } from './related';

let mockVersion = ACTIVITY_MOCK_VERSION;
let activities = [...initialActivities];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === ACTIVITY_MOCK_VERSION) return;
  activities = [...initialActivities];
  mockVersion = ACTIVITY_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./activity', (mod) => {
    if (!mod) return;
    activities = [...mod.initialActivities];
    mockVersion = mod.ACTIVITY_MOCK_VERSION;
    emit();
  });
}

export function getActivities(): Activity[] {
  syncMockData();
  return activities;
}

export function getActivity(id: number): Activity | undefined {
  syncMockData();
  return activities.find((item) => item.id === id);
}

export function upsertActivity(activity: Activity) {
  const index = activities.findIndex((item) => item.id === activity.id);
  activities = index === -1 ? [activity, ...activities] : activities.map((item) => (item.id === activity.id ? activity : item));
  emit();
}

export function patchActivities(updater: (list: Activity[]) => Activity[]) {
  activities = updater(activities);
  emit();
}

export function submitActivitiesForApproval(ids: number[], createdAt: string): Activity[] {
  const idSet = new Set(ids);
  const submitted: Activity[] = [];
  patchActivities((list) =>
    list.map((item) => {
      if (!idSet.has(item.id) || !canSubmitApproval(item)) return item;
      const next = { ...item, auditStatus: '待审核' as const };
      submitted.push(next);
      return next;
    }),
  );
  submitted.forEach((item) => recordApprovalSubmit(item.id, item.organizer, createdAt));
  return submitted;
}

export function reviewActivity(
  id: number,
  auditStatus: Extract<AuditStatus, '已通过' | '已驳回'>,
  comment: string,
  createdAt: string,
): Activity | undefined {
  let reviewed: Activity | undefined;
  patchActivities((list) =>
    list.map((item) => {
      if (item.id !== id || item.auditStatus !== '待审核') return item;
      reviewed = { ...item, auditStatus };
      return reviewed;
    }),
  );
  if (reviewed) {
    recordApprovalDecision(id, auditStatus === '已通过' ? '通过' : '驳回', activityReviewer, comment, createdAt);
  }
  return reviewed;
}

export function useActivities() {
  const [list, setList] = useState<Activity[]>(() => [...activities]);
  useEffect(() => {
    syncMockData();
    setList([...activities]);
    const onChange = () => setList([...activities]);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
