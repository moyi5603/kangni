import { Switch, Typography } from 'antd';
import { defaultCourseCommentConfig, type CourseCommentConfig } from '../model/training';

export const COURSE_COMMENT_CONFIG_ITEMS = [
  { key: 'commentEnabled', title: '评论', desc: '允许用户发表评论' },
  { key: 'commentAuditEnabled', title: '评论审核', desc: '评论是否需要审核（仅对当前设置后产生的数据生效）' },
  { key: 'likeEnabled', title: '点赞', desc: '允许用户点赞' },
  { key: 'favoriteEnabled', title: '收藏', desc: '允许用户收藏' },
] as const;

export function CourseCommentConfigFields({
  value,
  onChange,
  readOnly,
}: {
  value?: CourseCommentConfig;
  onChange?: (next: CourseCommentConfig) => void;
  readOnly?: boolean;
}) {
  const current = value ?? defaultCourseCommentConfig();
  return (
    <div className="comment-config-list">
      {COURSE_COMMENT_CONFIG_ITEMS.map((item) => (
        <div className="comment-config-item" key={item.key}>
          <div className="comment-config-copy">
            <Typography.Text strong>{item.title}</Typography.Text>
            <Typography.Text type="secondary">{item.desc}</Typography.Text>
          </div>
          <Switch
            checked={current[item.key]}
            checkedChildren="开"
            unCheckedChildren="关"
            aria-label={item.title}
            disabled={readOnly}
            onChange={(checked) => {
              if (readOnly) return;
              onChange?.({ ...current, [item.key]: checked });
            }}
          />
        </div>
      ))}
    </div>
  );
}
