export const CERTIFICATE_MOCK_VERSION = 1;

export const certificateCoverThemes = ['gold', 'purple', 'teal'] as const;
export type CertificateCoverTheme = (typeof certificateCoverThemes)[number];

export const certificateValidityTypes = ['长期有效', '自定义'] as const;
export type CertificateValidityType = (typeof certificateValidityTypes)[number];

export type CertificateRecord = {
  id: number;
  name: string;
  coverTheme: CertificateCoverTheme;
  numberRule: string;
  issuer: string;
  description: string;
  watermarkText: string;
  validityType: CertificateValidityType;
  issuedCount: number;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export const certificateCoverThemeStyle: Record<CertificateCoverTheme, string> = {
  gold: 'linear-gradient(135deg, #E6A93A, #F0C46A)',
  purple: 'linear-gradient(135deg, #7C6CFF, #A98AE0)',
  teal: 'linear-gradient(135deg, #1FB0B8, #5FD6DE)',
};

const seed = (
  id: number,
  name: string,
  coverTheme: CertificateCoverTheme,
  issuedCount: number,
  watermarkText: string,
): CertificateRecord => ({
  id,
  name,
  coverTheme,
  numberRule: 'EXAM-{年份}-{流水号}',
  issuer: '考试练习 · 企业学习平台',
  description: '已完成本认证考试，成绩合格，特此颁发以资证明。',
  watermarkText,
  validityType: '长期有效',
  issuedCount,
  creator: '产品管理员',
  createdAt: '2026-08-01 10:00:00',
  updatedAt: '2026-08-01 10:00:00',
});

export const initialCertificates: CertificateRecord[] = [
  seed(1, '数据合规与安全 · 内部认证', 'gold', 186, '内部认证'),
  seed(2, '高级产品能力 · 内部认证', 'purple', 92, '内部认证'),
  seed(3, '数据分析师 L1 · 内部认证', 'teal', 34, '内部认证'),
];
