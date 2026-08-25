import type { SVGProps } from 'react';

function SvgIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" className="c-icon" aria-hidden {...props} />;
}

export function IconBack() {
  return (
    <SvgIcon>
      <path d="M15 18 9 12l6-6" />
    </SvgIcon>
  );
}

export function IconClock() {
  return (
    <SvgIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </SvgIcon>
  );
}

export function IconPin() {
  return (
    <SvgIcon>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </SvgIcon>
  );
}

export function IconUser() {
  return (
    <SvgIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </SvgIcon>
  );
}

export function IconTicket() {
  return (
    <SvgIcon>
      <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Z" />
      <path d="M13 7v10" />
    </SvgIcon>
  );
}

export function IconCalendar() {
  return (
    <SvgIcon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </SvgIcon>
  );
}

export function IconLike() {
  return (
    <SvgIcon>
      <path d="M7 11v9H4v-9h3Zm3 9h7.2a2 2 0 0 0 2-1.7l1.2-7A2 2 0 0 0 18.4 9H13V5a2 2 0 0 0-2-2h-.4L7 11h3v9Z" />
    </SvgIcon>
  );
}

export function IconStar() {
  return (
    <SvgIcon>
      <path d="m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5Z" />
    </SvgIcon>
  );
}

export function IconShare() {
  return (
    <SvgIcon>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
    </SvgIcon>
  );
}

export function IconComment() {
  return (
    <SvgIcon>
      <path d="M5 5h14v10H8l-3 3V5Z" />
    </SvgIcon>
  );
}

export function IconFire() {
  return <span aria-hidden>🔥</span>;
}

export function IconHorn() {
  return <span aria-hidden>📣</span>;
}

export function IconChevronRight() {
  return (
    <SvgIcon>
      <path d="m9 18 6-6-6-6" />
    </SvgIcon>
  );
}
