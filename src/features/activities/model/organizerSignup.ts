import type { Activity } from './activity';
import { applyOrganizerSignup, applyOrganizerSignups, organizerSignupIdentity } from './organizerSignupApply';
import { getRelatedList, patchRelated, type SignupRecord } from './related';

export { applyOrganizerSignup, applyOrganizerSignups, organizerSignupIdentity };

export function ensureOrganizerSignup(activity: Activity): SignupRecord | undefined {
  const identity = organizerSignupIdentity(activity);
  if (!identity.name) return undefined;
  const before = getRelatedList('signups');
  const next = applyOrganizerSignup(before, activity);
  const changed = next.find((item) => item.activityId === activity.id && item.name === identity.name);
  if (next !== before) patchRelated('signups', () => next);
  return changed;
}

export function ensureOrganizerSignups(activities: readonly Activity[]) {
  patchRelated('signups', (list) => applyOrganizerSignups(list, activities));
}
