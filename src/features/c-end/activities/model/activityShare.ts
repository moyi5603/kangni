import { orgPeople, type OrgPerson } from '../../../activities/model/activity';

export function listShareContacts(excludePhone: string): OrgPerson[] {
  return orgPeople.filter((person) => person.phone !== excludePhone);
}

export function filterShareContacts(people: readonly OrgPerson[], query: string): OrgPerson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...people];
  return people.filter(
    (person) =>
      person.name.toLowerCase().includes(needle) || person.department.toLowerCase().includes(needle),
  );
}

export function shareConfirmMessage(count: number): string {
  return `已分享给 ${count} 人`;
}
