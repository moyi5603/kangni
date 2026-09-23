import { BannerLinkPicker } from '../../../shared/decoration/BannerLinkPicker';
import { getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import { useInterestGroupCategories, useInterestGroups } from '../model/interestGroupStore';

export function IgBannerLinkPicker({
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
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  return (
    <BannerLinkPicker
      open={open}
      value={value}
      noun="兴趣圈"
      nameColumn="兴趣圈名称"
      categoryOptions={categories.map((item) => ({ value: item.label, label: item.label }))}
      statusOptions={[
        { value: '已发布', label: '已发布' },
        { value: '未发布', label: '未发布' },
      ]}
      rows={groups.map((item) => ({
        id: item.id,
        title: item.name,
        category: getInterestGroupCategoryLabel(item.categoryKey, categories),
        time: item.createdAt,
        status: item.publishStatus,
        statusColor: item.publishStatus === '已发布' ? 'success' : 'default',
        link: `ig-group:${item.id}`,
      }))}
      onCancel={onCancel}
      onOk={onOk}
    />
  );
}
