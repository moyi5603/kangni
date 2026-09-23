import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, InputNumber, Space, Tooltip, Typography } from 'antd';
import { groupLimitsSum, type SignupGroupOption } from '../model/signupFields';

type SignupGroupsEditorProps = {
  groups: SignupGroupOption[];
  signupTotalLimit?: number;
  onChange?: (groups: SignupGroupOption[]) => void;
};

export function SignupGroupsEditor({ groups, signupTotalLimit, onChange }: SignupGroupsEditorProps) {
  const groupSum = groupLimitsSum(groups);
  const groupSumMatched = signupTotalLimit != null && groupSum === signupTotalLimit;
  const emit = (next: SignupGroupOption[]) => onChange?.(next);

  return (
    <div className="activity-signup-groups">
      <Typography.Text type={groupSumMatched ? 'secondary' : 'danger'}>
        各组合计 {groupSum}（各组人数合计要等于报名总人数{signupTotalLimit == null ? '' : signupTotalLimit}）
      </Typography.Text>
      {groups.map((group, groupIndex) => {
        const canRemove = groups.length > 2;
        const name = group.name.trim() || `分组 ${groupIndex + 1}`;
        return (
          <Flex key={groupIndex} className="activity-signup-groups-row" align="center" gap={8} wrap={false}>
            <Input
              className="activity-signup-groups-name"
              value={group.name}
              maxLength={20}
              placeholder="请输入分组名称"
              onChange={(event) => {
                emit(groups.map((item, i) => (i === groupIndex ? { ...item, name: event.target.value } : item)));
              }}
            />
            <Space.Compact className="activity-unit-compact">
              <Button disabled>限</Button>
              <InputNumber
                min={0}
                precision={0}
                className="activity-signup-groups-limit"
                value={group.limit}
                controls={false}
                onChange={(value) => {
                  emit(
                    groups.map((item, i) =>
                      i === groupIndex ? { ...item, limit: typeof value === 'number' ? value : 0 } : item,
                    ),
                  );
                }}
              />
              <Button disabled>人</Button>
            </Space.Compact>
            <Tooltip title={canRemove ? '删除分组' : '至少保留 2 个分组'}>
              <Button
                type="text"
                danger={canRemove}
                aria-label={`删除分组 ${name}`}
                icon={<MinusCircleOutlined />}
                disabled={!canRemove}
                onClick={() => {
                  if (!canRemove) return;
                  emit(groups.filter((_, i) => i !== groupIndex));
                }}
              />
            </Tooltip>
          </Flex>
        );
      })}
      <Button type="dashed" icon={<PlusOutlined />} className="activity-signup-groups-add" onClick={() => emit([...groups, { name: '', limit: 0 }])}>
        添加分组
      </Button>
    </div>
  );
}
