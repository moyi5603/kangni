import { certificateCoverThemeStyle, type CertificateRecord } from '../model/certificate';

type CertificatePreviewProps = {
  record: Pick<CertificateRecord, 'name' | 'issuer' | 'description' | 'watermarkText' | 'coverTheme' | 'numberRule'>;
  sampleName?: string;
};

export function CertificatePreview({ record, sampleName = '学员姓名' }: CertificatePreviewProps) {
  return (
    <div className="certificate-preview" style={{ borderTopColor: certificateCoverThemeStyle[record.coverTheme] }}>
      <div className="certificate-preview__watermark" aria-hidden>
        {record.watermarkText}
      </div>
      <div className="certificate-preview__inner">
        <div className="certificate-preview__badge" style={{ background: certificateCoverThemeStyle[record.coverTheme] }}>
          🏅
        </div>
        <div className="certificate-preview__title">{record.name}</div>
        <div className="certificate-preview__lead">兹证明</div>
        <div className="certificate-preview__name">{sampleName}</div>
        <div className="certificate-preview__body">{record.description}</div>
        <div className="certificate-preview__meta">
          <div>
            <div className="certificate-preview__meta-label">证书编号</div>
            <div className="certificate-preview__meta-value">{record.numberRule.replace('{年份}', '2026').replace('{流水号}', '0001')}</div>
          </div>
          <div className="certificate-preview__meta-right">
            <div className="certificate-preview__meta-label">颁发日期</div>
            <div className="certificate-preview__meta-value">2026.08.22</div>
          </div>
        </div>
        <div className="certificate-preview__issuer">{record.issuer}</div>
      </div>
    </div>
  );
}
