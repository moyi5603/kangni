import type { ExamRankAvatar } from '../model/clientExamRank';

const MEDAL = {
  1: { face: '#f6c543', rim: '#e3a61a', sheen: '#ffe9a3' },
  2: { face: '#cfd3da', rim: '#9aa3ad', sheen: '#eef1f4' },
  3: { face: '#d7a36a', rim: '#b37a3d', sheen: '#f0d2a8' },
} as const;

export function ExamRankMedal({ rank }: { rank: 1 | 2 | 3 }) {
  const tone = MEDAL[rank];
  return (
    <svg className={`c-exam-rank-medal is-${rank}`} viewBox="0 0 48 56" aria-hidden="true">
      <path d="M18 34 12 52l12-7 12 7-6-18" fill="#ff7a3d" />
      <path d="M18 34 12 52l12-7Z" fill="#e24d24" />
      <circle cx="24" cy="22" r="16" fill={tone.rim} />
      <circle cx="24" cy="22" r="13.2" fill={tone.face} />
      <circle cx="24" cy="22" r="11" fill="none" stroke={tone.sheen} strokeWidth="1.4" />
      <text x="24" y="27" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">
        {rank}
      </text>
    </svg>
  );
}

function AvatarMe() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#dbe7ff" />
      <circle cx="20" cy="15" r="6.2" fill="#4c7dff" />
      <path d="M7.5 34.5c1.8-8 7-12 12.5-12s10.7 4 12.5 12" fill="#4c7dff" />
    </svg>
  );
}

function AvatarSuit() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#c9d4e8" />
      <circle cx="20" cy="15" r="6" fill="#8d6a4a" />
      <path d="M8 35c2-8.5 7-13 12-13s10 4.5 12 13" fill="#2b3d5c" />
      <path d="M17 24 20 29l3-5v11h-6V24Z" fill="#f3f6fb" />
    </svg>
  );
}

function AvatarCat() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#ffe3b5" />
      <path d="M8 16 14 6l4 8M32 16 26 6l-4 8" fill="#f4b46a" />
      <circle cx="20" cy="22" r="10" fill="#f4b46a" />
      <circle cx="16" cy="21" r="1.3" fill="#3d2a1a" />
      <circle cx="24" cy="21" r="1.3" fill="#3d2a1a" />
      <path d="M18.5 25.2h3" stroke="#3d2a1a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AvatarUser() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#f3d7c6" />
      <circle cx="20" cy="16" r="6" fill="#c48a62" />
      <path d="M8 35c2-9 7-13 12-13s10 4 12 13" fill="#7a4d36" />
    </svg>
  );
}

const AVATARS: Record<ExamRankAvatar, () => ReturnType<typeof AvatarMe>> = {
  me: AvatarMe,
  suit: AvatarSuit,
  cat: AvatarCat,
  user: AvatarUser,
};

export function ExamRankAvatarMark({ kind }: { kind: ExamRankAvatar }) {
  const Icon = AVATARS[kind];
  return <Icon />;
}
