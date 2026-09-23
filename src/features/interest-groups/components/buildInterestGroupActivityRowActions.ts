import type { TableRowAction } from '../../../shared/ui/TableRowActions';
import {
  canCloseInterestGroupSignup,
  canDeleteInterestGroupActivity,
  canReopenInterestGroupSignup,
  canRevokeInterestGroupActivity,
  canTerminateInterestGroupActivity,
  revokeInterestGroupActivityBlockReason,
  type InterestGroupActivity,
} from '../model/interestGroupActivity';

export type InterestGroupActivityRowActionHandlers = {
  onDetail: (record: InterestGroupActivity) => void;
  onEdit: (record: InterestGroupActivity) => void;
  onCopy: (record: InterestGroupActivity) => void;
  onRevoke: (record: InterestGroupActivity) => void;
  onPublish: (record: InterestGroupActivity) => void;
  onPin: (record: InterestGroupActivity) => void;
  onMoveUp: (record: InterestGroupActivity) => void;
  onMoveDown: (record: InterestGroupActivity) => void;
  onCloseSignup: (record: InterestGroupActivity) => void;
  onReopenSignup: (record: InterestGroupActivity) => void;
  onTerminate: (record: InterestGroupActivity) => void;
  onDelete: (record: InterestGroupActivity) => void;
};

export function buildInterestGroupActivityRowActions(
  record: InterestGroupActivity,
  handlers: InterestGroupActivityRowActionHandlers,
  move: { canMove: boolean; upDisabled: boolean; downDisabled: boolean },
): TableRowAction[] {
  const statusAction: TableRowAction =
    record.publishStatus === '已发布'
      ? {
          key: 'revoke',
          label: '撤销',
          ariaLabel: `撤销 ${record.title}`,
          onClick: () => handlers.onRevoke(record),
          disabled: !canRevokeInterestGroupActivity(record),
          tooltip: revokeInterestGroupActivityBlockReason(record),
        }
      : {
          key: 'publish',
          label: '发布',
          ariaLabel: `发布 ${record.title}`,
          onClick: () => handlers.onPublish(record),
        };

  const actions: TableRowAction[] = [
    {
      key: 'detail',
      label: '详情',
      ariaLabel: `详情 ${record.title}`,
      onClick: () => handlers.onDetail(record),
    },
    {
      key: 'edit',
      label: '编辑',
      ariaLabel: `编辑 ${record.title}`,
      onClick: () => handlers.onEdit(record),
    },
    {
      key: 'copy',
      label: '复制',
      ariaLabel: `复制 ${record.title}`,
      onClick: () => handlers.onCopy(record),
    },
    statusAction,
    {
      key: 'pin',
      label: record.pinned ? '取消置顶' : '置顶',
      ariaLabel: record.pinned ? `取消置顶 ${record.title}` : `置顶 ${record.title}`,
      onClick: () => handlers.onPin(record),
    },
  ];
  if (move.canMove) {
    actions.push(
      {
        key: 'up',
        label: '上移',
        ariaLabel: `上移 ${record.title}`,
        disabled: move.upDisabled,
        onClick: () => handlers.onMoveUp(record),
      },
      {
        key: 'down',
        label: '下移',
        ariaLabel: `下移 ${record.title}`,
        disabled: move.downDisabled,
        onClick: () => handlers.onMoveDown(record),
      },
    );
  }
  if (canCloseInterestGroupSignup(record)) {
    actions.push({
      key: 'close-signup',
      label: '截止报名',
      ariaLabel: `截止报名 ${record.title}`,
      onClick: () => handlers.onCloseSignup(record),
    });
  }
  if (canReopenInterestGroupSignup(record)) {
    actions.push({
      key: 'reopen-signup',
      label: '恢复报名',
      ariaLabel: `恢复报名 ${record.title}`,
      onClick: () => handlers.onReopenSignup(record),
    });
  }
  if (canTerminateInterestGroupActivity(record)) {
    actions.push({
      key: 'terminate',
      label: '终止活动',
      ariaLabel: `终止活动 ${record.title}`,
      onClick: () => handlers.onTerminate(record),
      danger: true,
    });
  }
  actions.push({
    key: 'delete',
    label: '删除',
    ariaLabel: `删除 ${record.title}`,
    onClick: () => handlers.onDelete(record),
    danger: true,
    disabled: !canDeleteInterestGroupActivity(record),
    tooltip: canDeleteInterestGroupActivity(record) ? undefined : '已有人报名，无法删除',
  });
  return actions;
}
