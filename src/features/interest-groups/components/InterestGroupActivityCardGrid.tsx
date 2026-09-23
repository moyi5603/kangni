import { Space, Tag } from 'antd';
import { MediaEntityCardGrid } from '../../../shared/ui/MediaEntityCardGrid';
import type { TableRowAction } from '../../../shared/ui/TableRowActions';
import {
  formatInterestGroupActivityTime,
  getInterestGroupLifecycleStatus,
  interestGroupPublishStatusColor,
  lifecycleStatusColor,
  type InterestGroupActivity,
} from '../model/interestGroupActivity';

function groupLabel(groupId: number | null, names: Map<number, string>) {
  if (groupId == null) return '未归属兴趣圈';
  return names.get(groupId) ?? '未归属兴趣圈';
}

export function InterestGroupActivityCardGrid({
  activities,
  groupNames,
  hideGroupName,
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  onOpenDetail,
  buildActions,
}: {
  activities: InterestGroupActivity[];
  groupNames: Map<number, string>;
  hideGroupName: boolean;
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onOpenDetail: (record: InterestGroupActivity) => void;
  buildActions: (record: InterestGroupActivity) => TableRowAction[];
}) {
  return (
    <MediaEntityCardGrid
      gridClassName="ig-activity-card-grid"
      emptyDescription={emptyDescription}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      items={activities.map((record) => {
        const life = getInterestGroupLifecycleStatus(record);
        const time = formatInterestGroupActivityTime(record);
        const summary = hideGroupName ? time : `${groupLabel(record.groupId, groupNames)} ${time}`;
        return {
          key: record.id,
          coverUrl: record.coverUrl,
          title: record.title,
          summary,
          statusLabel: life,
          statusColor: lifecycleStatusColor[life],
          extra: (
            <Space size={4} wrap={false}>
              {record.pinned ? <Tag color="blue">置顶</Tag> : null}
              <Tag color={interestGroupPublishStatusColor[record.publishStatus]}>{record.publishStatus}</Tag>
              <span>创建人 {record.creator}</span>
            </Space>
          ),
          actions: buildActions(record),
          onOpen: () => onOpenDetail(record),
        };
      })}
    />
  );
}
