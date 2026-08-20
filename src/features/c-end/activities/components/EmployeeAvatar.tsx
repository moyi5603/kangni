import { employeeAvatarColor, employeeAvatarLetter } from '../../../activities/model/employeeAvatar';

export function EmployeeAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`c-avatar c-avatar-${size}`}
      style={{ background: employeeAvatarColor(name) }}
      aria-hidden
    >
      {employeeAvatarLetter(name)}
    </span>
  );
}
