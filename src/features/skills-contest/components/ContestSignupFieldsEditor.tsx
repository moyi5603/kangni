import { Tag, Typography } from 'antd';
import { SignupFieldsEditor } from '../../activities/components/SignupFieldsEditor';
import type { ContestSignupField } from '../model/contest';
import { activitySignupFieldsOf, mergeContestSignupFields } from '../model/contestSignupFields';

export function ContestSignupFieldsEditor({
  value,
  onChange,
}: {
  value?: ContestSignupField[];
  onChange?: (value: ContestSignupField[]) => void;
}) {
  const fields = value ?? [];
  return (
    <div>
      <div className="signup-field-row" style={{ marginBottom: 12 }}>
        <Typography.Text strong>所属区域</Typography.Text>
        <div>
          <Tag>固定字段</Tag>
          <Typography.Text type="secondary"> 选项来自区域配置中的启用项，报名时单选，不可移除。</Typography.Text>
        </div>
      </div>
      <SignupFieldsEditor
        value={activitySignupFieldsOf(fields)}
        onChange={(next) => onChange?.(mergeContestSignupFields(next, fields))}
      />
    </div>
  );
}
