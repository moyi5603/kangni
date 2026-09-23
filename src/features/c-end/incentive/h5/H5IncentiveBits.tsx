import { Button, Tag } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import type { IncentiveH5Badge } from './incentiveH5Data';
import { INCENTIVE_H5_PEOPLE, INCENTIVE_H5_RECEIPTS } from './incentiveH5Data';

export function BadgeArt({
  badge,
  className = '',
  locked = false,
}: {
  badge: IncentiveH5Badge;
  className?: string;
  locked?: boolean;
}) {
  return (
    <span className={`badge-artwork-shell ${locked ? 'is-locked' : ''} ${className}`}>
      <img src={`/badges/${badge.id.toLowerCase()}.png`} alt={badge.name} width={512} height={512} draggable={false} />
    </span>
  );
}

export function PersonPhoto({ name, size = 40, className = '' }: { name: string; size?: number; className?: string }) {
  const person = INCENTIVE_H5_PEOPLE.find((item) => item.name === name) ?? INCENTIVE_H5_PEOPLE[0];
  return (
    <span
      className={`employee-photo ${className}`}
      role="img"
      aria-label={`${name}头像`}
      style={{ width: size, height: size, backgroundImage: `url('/avatars/${person.id.toLowerCase()}.png?v=3')` }}
    />
  );
}

export function MobileBackbar({ title, onBack, ariaLabel = '返回首页' }: { title: string; onBack: () => void; ariaLabel?: string }) {
  return (
    <div className="mobile-form-backbar">
      <Button type="text" shape="circle" icon={<LeftOutlined />} aria-label={ariaLabel} onClick={onBack} />
      <strong>{title}</strong>
      <i />
    </div>
  );
}

export function BadgeDetail({
  badge,
  onIssue,
  acquiredAt,
  showIssueButton = true,
}: {
  badge: IncentiveH5Badge;
  onIssue?: () => void;
  acquiredAt?: string;
  showIssueButton?: boolean;
}) {
  const receipts = badge.scope === '同事认可' && acquiredAt ? (INCENTIVE_H5_RECEIPTS[badge.id] ?? []) : [];
  const total = receipts.reduce((sum, item) => sum + item.count, 0);
  const summary = [badge.description.trim(), badge.definition.trim()].filter((text, index, list) => {
    if (!text) return false;
    return !list.some((other, otherIndex) => otherIndex < index && (other.includes(text) || text.includes(other)));
  }).join('\n');
  return (
    <div className="badge-detail-content">
      <span className="badge-detail-kicker">
        {badge.scope} · {badge.category}
      </span>
      <div className="badge-detail-medal">
        <BadgeArt badge={badge} />
      </div>
      <div className="badge-detail-title-row">
        <h2>{badge.name}</h2>
        <strong>{badge.points} 积分</strong>
      </div>
      {acquiredAt !== undefined && (
        <span className={`badge-detail-status ${acquiredAt ? 'earned' : 'locked'}`}>
          {acquiredAt ? `${acquiredAt} 获得` : '未获得'}
        </span>
      )}
      {summary ? <p className="badge-detail-summary">{summary}</p> : null}
      {receipts.length > 0 && (
        <section className="badge-detail-receipts">
          <header>
            <span>认可同事</span>
            <b>累计获得 {total} 次</b>
          </header>
          <div>
            {receipts.map((item) => (
              <article key={item.colleague}>
                <i>{item.colleague.slice(0, 1)}</i>
                <b>{item.colleague}</b>
                <strong>{item.count} 次</strong>
              </article>
            ))}
          </div>
        </section>
      )}
      {onIssue && showIssueButton && (
        <Button className="badge-detail-action" type="primary" size="large" block onClick={onIssue}>
          发放勋章
        </Button>
      )}
    </div>
  );
}

export function BadgeRules({ badge }: { badge: IncentiveH5Badge }) {
  return (
    <section className="behavior-guidance plain" aria-label={`${badge.name}行为认定说明`}>
      <header>
        <div>
          <b>{badge.name}</b>
          <span>
            {badge.scope} · {badge.category}
          </span>
        </div>
        <Tag color="blue">{badge.points}积分</Tag>
      </header>
      <div className="behavior-guidance-plain">
        <section>
          <h3>行为定义</h3>
          <p>{badge.definition}</p>
        </section>
        <section>
          <h3>积分认定标准</h3>
          <ul>
            {badge.criteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>典型场景说明</h3>
          <ul>
            {badge.examples.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>不计分情形</h3>
          <ul className="danger">
            {badge.exclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
