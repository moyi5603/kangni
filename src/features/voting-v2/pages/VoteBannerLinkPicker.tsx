import dayjs from 'dayjs';
import { BannerLinkPicker } from '../../../shared/decoration/BannerLinkPicker';
import { resolveVoteV2Status, voteV2Periods, voteV2Statuses } from '../model/voteV2';
import { useVoteV2Campaigns } from '../model/voteV2Store';

const statusColor = { 未开始: 'default', 进行中: 'processing', 已结束: 'default' } as const;

export function VoteBannerLinkPicker({
  open,
  value,
  onCancel,
  onOk,
}: {
  open: boolean;
  value: string;
  onCancel: () => void;
  onOk: (link: string) => void;
}) {
  const campaigns = useVoteV2Campaigns();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return (
    <BannerLinkPicker
      open={open}
      value={value}
      noun="投票"
      nameColumn="投票名称"
      categoryOptions={voteV2Periods.map((item) => ({ value: item, label: item }))}
      statusOptions={voteV2Statuses.map((item) => ({ value: item, label: item }))}
      rows={campaigns.map((item) => {
        const status = resolveVoteV2Status(item, now);
        return {
          id: item.id,
          title: item.name,
          category: item.period,
          time: `${item.startAt} ~ ${item.endAt}`,
          status,
          statusColor: statusColor[status],
          link: `#/c/h5/vote-v2-${item.id}`,
        };
      })}
      onCancel={onCancel}
      onOk={onOk}
    />
  );
}
