import { useMemo } from 'react';
import { goH5Back, toH5ExamResultHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { listMyCertificates } from '../../exams/model/clientCertificate';

function IconShield() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden>
      <path
        d="M20 4 8 8.5v9.2c0 7.2 5 13.6 12 16.3 7-2.7 12-9.1 12-16.3V8.5L20 4Z"
        fill="#3b82f6"
      />
      <path d="M14.5 20.2 18.2 24l7.6-8.2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPending() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden>
      <rect x="8" y="6" width="20" height="26" rx="3" fill="#fb923c" />
      <path d="M13 14h10M13 19h10M13 24h6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 22.5 28 16.5l3 3-6 6h-3v-3Z" fill="#f97316" stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}

export function H5MyCertificates() {
  const board = useMemo(() => listMyCertificates(), []);

  return (
    <H5ActivityShell className="is-certs" title="我的认证" onBack={goH5Back}>
      <div className="c-certs">
        <div className="c-certs-stats">
          <div className="c-certs-stat">
            <IconShield />
            <div>
              <b>{board.earned.length}</b>
              <span>已获认证</span>
            </div>
          </div>
          <div className="c-certs-stat">
            <IconPending />
            <div>
              <b>{board.pendingCount}</b>
              <span>待考取</span>
            </div>
          </div>
        </div>

        <h2>已获证书</h2>
        <ul className="c-cert-list">
          {board.earned.map((card) => (
            <li key={card.examId} className="c-cert-card">
              <div className="c-cert-cover" aria-hidden>
                <span className="c-cert-seal" />
                <strong>{card.title}</strong>
              </div>
              <div className="c-cert-body">
                <h3>{card.title}</h3>
                <p>
                  颁发于{card.issuedOn} · {card.validity}
                </p>
                <div className="c-cert-foot">
                  <span>考试{card.score}分</span>
                  <a href={toH5ExamResultHash(card.examId)}>查看证书 &gt;</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </H5ActivityShell>
  );
}
