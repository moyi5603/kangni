export const AWARD_CERTIFICATE_MOCK_VERSION = 1;

export type AwardCertificateRecord = {
  id: number;
  name: string;
  description: string;
  fileName: string;
  imageUrl: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

function badge(fill: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="112" viewBox="0 0 160 112"><rect width="160" height="112" rx="8" fill="${fill}"/><text x="80" y="64" text-anchor="middle" font-size="28" font-family="PingFang SC, sans-serif" fill="#fff">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const initialAwardCertificates: AwardCertificateRecord[] = [
  {
    id: 1,
    name: '优秀员工电子证书',
    description: '表彰年度表现突出、持续创造价值的优秀员工。',
    fileName: 'staff.png',
    imageUrl: badge('#d48806', '优'),
    creator: '产品管理员',
    createdAt: '2026-07-01 10:00:00',
    updatedAt: '2026-07-01 10:00:00',
  },
  {
    id: 2,
    name: '项目攻坚电子证书',
    description: '用于重点项目攻坚、按期高质量交付的团队或个人。',
    fileName: 'project.png',
    imageUrl: badge('#1d39c4', '项'),
    creator: '产品管理员',
    createdAt: '2026-07-02 10:00:00',
    updatedAt: '2026-07-02 10:00:00',
  },
];
