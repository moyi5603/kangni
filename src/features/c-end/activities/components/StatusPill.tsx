import type { ActivityStatus } from '../../../activities/model/activity';

const LABELS: Record<ActivityStatus, string> = {
  未开始: '未开始',
  进行中: '进行中',
  已结束: '已结束',
};

const CLASS_MAP: Record<ActivityStatus, string> = {
  未开始: 'is-upcoming',
  进行中: 'is-ongoing',
  已结束: 'is-ended',
};

export function StatusPill({ status }: { status: ActivityStatus }) {
  return <span className={`c-pill ${CLASS_MAP[status]}`}>{LABELS[status]}</span>;
}
